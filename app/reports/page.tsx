'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SaleData = {
  paid_amount: number
  created_at: string
  user_id: string
}

type BaleData = {
  cost_price: number
}

type SaleItem = {
  item_description: string
  original_price: number
  paid_amount: number
  status: string
}

type CustomerSale = {
  created_at: string
  customer_id: string
  sales_items: SaleItem[]
}

export default function ReportsPage() {
  const [tab, setTab] = useState('daily')
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const [revenue, setRevenue] = useState(0)
  const [costs, setCosts] = useState(0)
  const [profit, setProfit] = useState(0)
  const [totalSales, setTotalSales] = useState(0)

  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [customerSales, setCustomerSales] = useState<CustomerSale[]>([])

  const [cashiers, setCashiers] = useState<{id: string; total: number; count: number}[]>([])

  const router = useRouter()

  useEffect(() => {
    if (tab === 'daily') loadDailyReport()
    if (tab === 'customers') loadCustomers()
    if (tab === 'cashiers') loadCashierReport()
  }, [tab, dateFrom, dateTo])

  useEffect(() => {
    if (selectedCustomer) loadCustomerLedger()
  }, [selectedCustomer])

  const loadDailyReport = async () => {
    setLoading(true)
    const { data: sales } = await supabase
    .from('sales')
    .select('paid_amount, total_amount')
    .gte('created_at', dateFrom + 'T00:00:00')
    .lte('created_at', dateTo + 'T23:59:59')

    const salesTyped = sales as SaleData[] | null
    const rev = salesTyped?.reduce((s: number, i) => s + (i.paid_amount || 0), 0) || 0
    setRevenue(rev)
    setTotalSales(salesTyped?.length || 0)

    const { data: items } = await supabase
    .from('sales_items')
    .select('bale_id, sales!inner(created_at)')
    .gte('sales.created_at', dateFrom + 'T00:00:00')
    .lte('sales.created_at', dateTo + 'T23:59:59')
    .not('bale_id', 'is', null)

    const baleIds = [...new Set(items?.map(i => i.bale_id).filter(Boolean))]
    if (baleIds.length > 0) {
      const { data: bales } = await supabase
      .from('bales')
      .select('cost_price')
      .in('id', baleIds)

      const balesTyped = bales as BaleData[] | null
      const cost = balesTyped?.reduce((s: number, b) => s + (b.cost_price || 0), 0) || 0
      setCosts(cost)
      setProfit(rev - cost)
    } else {
      setCosts(0)
      setProfit(rev)
    }
    setLoading(false)
  }

  const loadCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers(data || [])
  }

  const loadCustomerLedger = async () => {
    setLoading(true)
    const { data } = await supabase
    .from('sales')
    .select(`*, sales_items(item_description, original_price, paid_amount, status)`)
    .eq('customer_id', selectedCustomer)
    .order('created_at', { ascending: false })
    .limit(50)
    setCustomerSales((data as CustomerSale[]) || [])
    setLoading(false)
  }

  const loadCashierReport = async () => {
    setLoading(true)
    const { data } = await supabase
    .from('sales')
    .select('user_id, paid_amount, created_at')
    .gte('created_at', dateFrom + 'T00:00:00')
    .lte('created_at', dateTo + 'T23:59:59')

    const dataTyped = data as { user_id: string; paid_amount: number; created_at: string }[] | null
    const grouped = dataTyped?.reduce((acc: Record<string, { total: number; count: number }>, sale) => {
      if (!acc[sale.user_id]) acc[sale.user_id] = { total: 0, count: 0 }
      acc[sale.user_id].total += sale.paid_amount || 0
      acc[sale.user_id].count += 1
      return acc
    }, {}) || {}

    setCashiers(Object.entries(grouped).map(([id, data]) => ({ id,...data })))
    setLoading(false)
  }

  const exportToCSV = () => {
    if (tab === 'daily') {
      const csv = `Date From,Date To,Revenue,Costs,Profit,Total Sales\n${dateFrom},${dateTo},${revenue},${costs},${profit},${totalSales}`
      downloadCSV(csv, `daily_report_${dateFrom}.csv`)
    }
    if (tab === 'customers' && selectedCustomer) {
      const cust = customers.find(c => c.id === selectedCustomer)
      const rows = customerSales.flatMap(s =>
        s.sales_items.map((i: SaleItem) =>
          `${new Date(s.created_at).toLocaleDateString()},${cust?.name},${i.item_description},${i.original_price},${i.paid_amount},${i.status}`
        )
      )
      const csv = `Date,Customer,Item,Price,Paid,Status\n${rows.join('\n')}`
      downloadCSV(csv, `ledger_${cust?.name}.csv`)
    }
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  const margin = revenue > 0? ((profit/revenue)*100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* FIXED: px-4 py-6 pb-28 for spacing */}
      <div className="px-4 py-6 pb-28 max-w-4xl mx-auto">

        {/* FIXED: Header with proper spacing */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Reports</h1>
          <button onClick={exportToCSV} className="bg-green-600 px-5 py-2.5 rounded-xl text-sm font-semibold">
            Export CSV
          </button>
        </div>

        {/* FIXED: Tabs with gap-2 */}
        <div className="flex gap-2 mb-5 bg-gray-800 p-1.5 rounded-xl">
          <button onClick={() => setTab('daily')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${tab==='daily'?'bg-purple-600':'text-gray-400'}`}>Daily P&L</button>
          <button onClick={() => setTab('customers')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${tab==='customers'?'bg-purple-600':'text-gray-400'}`}>Customers</button>
          <button onClick={() => setTab('cashiers')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${tab==='cashiers'?'bg-purple-600':'text-gray-400'}`}>Cashiers</button>
        </div>

        {/* FIXED: Date inputs with pr-10 for arrow space */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            className="bg-gray-800 p-3 pr-10 rounded-xl text-sm text-white" />
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            className="bg-gray-800 p-3 pr-10 rounded-xl text-sm text-white" />
        </div>

        {/* DAILY P&L TAB */}
        {tab === 'daily' && (
          <div>
            {loading? <div className="text-center py-20 text-gray-400">Loading...</div> : (
              <>
                {/* FIXED: gap-4 + p-5 cards */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-gray-800 p-5 rounded-xl">
                    <div className="text-gray-400 text-xs mb-1">REVENUE</div>
                    <div className="text-2xl font-bold text-green-400">KES {revenue.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-800 p-5 rounded-xl">
                    <div className="text-gray-400 text-xs mb-1">BALE COSTS</div>
                    <div className="text-2xl font-bold text-red-400">KES {costs.toLocaleString()}</div>
                  </div>

                  {/* FIXED: leading-tight + spacing */}
                  <div className="bg-gray-800 p-5 rounded-xl col-span-2 border-2 border-purple-600">
                    <div className="text-gray-400 text-xs mb-1">GROSS PROFIT</div>
                    <div className={`text-3xl font-bold leading-tight ${profit >= 0? 'text-green-400' : 'text-red-400'}`}>
                      KES {profit.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">Margin: {margin}%</div>
                  </div>
                </div>

                <div className="bg-gray-800 p-5 rounded-xl space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Sales:</span>
                    <span className="font-semibold">{totalSales} transactions</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg Sale:</span>
                    <span className="font-semibold">KES {totalSales > 0? Math.round(revenue/totalSales).toLocaleString() : 0}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* CUSTOMER LEDGER TAB */}
        {tab === 'customers' && (
          <div>
            <select value={selectedCustomer} onChange={e=>setSelectedCustomer(e.target.value)}
              className="w-full bg-gray-800 p-4 rounded-xl mb-5 text-white">
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-gray-700 text-xs font-semibold grid-cols-5 gap-3">
                  <div>DATE</div>
                  <div className="col-span-2">ITEM</div>
                  <div className="text-right">PRICE</div>
                  <div className="text-right">BAL</div>
                </div>
                {loading? <div className="p-8 text-center text-gray-400">Loading...</div> :
                  customerSales.flatMap(s =>
                    s.sales_items.map((i: SaleItem, idx: number) => (
                      <div key={idx} className="grid grid-cols-5 gap-3 p-4 border-b border-gray-700 text-sm">
                        <div className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString('en-KE')}</div>
                        <div className="col-span-2 truncate">{i.item_description}</div>
                        <div className="text-right">KES {i.original_price.toLocaleString()}</div>
                        <div className={`text-right font-medium ${i.original_price - i.paid_amount > 0?'text-orange-400':''}`}>
                          KES {(i.original_price - i.paid_amount).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )
                }
              </div>
            )}
          </div>
        )}

        {/* CASHIER PERFORMANCE TAB */}
        {tab === 'cashiers' && (
          <div className="space-y-4">
            {loading? <div className="text-center py-20 text-gray-400">Loading...</div> :
              cashiers.map((c, idx) => (
                <div key={idx} className="bg-gray-800 p-5 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-lg mb-1">Cashier {idx + 1}</div>
                      <div className="text-xs text-gray-400">{c.count} sales</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">KES {c.total.toLocaleString()}</div>
                      <div className="text-xs text-gray-400 mt-1">Avg: KES {Math.round(c.total/c.count).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* FIXED: Bottom nav with bigger tap area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="flex justify-around py-3.5">
          <button onClick={() => router.push('/sales/new')} className="flex flex-col items-center text-gray-400 text-xs gap-1">
            <span className="text-xl">📦</span> POS
          </button>
          <button onClick={() => router.push('/sales/my-sales')} className="flex flex-col items-center text-gray-400 text-xs gap-1">
            <span className="text-xl">📊</span> Sales
          </button>
          <button onClick={() => router.push('/bales')} className="flex flex-col items-center text-gray-400 text-xs gap-1">
            <span className="text-xl">📦</span> Bales
          </button>
          <button className="flex flex-col items-center text-purple-400 font-semibold text-xs gap-1">
            <span className="text-xl">📈</span> Reports
          </button>
        </div>
      </div>
    </div>
  )
}