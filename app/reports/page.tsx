'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ReportsPage() {
  const [tab, setTab] = useState('daily')
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  // Daily P&L
  const [revenue, setRevenue] = useState(0)
  const [costs, setCosts] = useState(0)
  const [profit, setProfit] = useState(0)
  const [totalSales, setTotalSales] = useState(0)

  // Customer Ledger
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [customerSales, setCustomerSales] = useState<any[]>([])

  // Cashier Performance
  const [cashiers, setCashiers] = useState<any[]>([])

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

    // 1. Revenue from sales
    const { data: sales } = await supabase
   .from('sales')
   .select('paid_amount, total_amount')
   .gte('created_at', dateFrom + 'T00:00:00')
   .lte('created_at', dateTo + 'T23:59:59')

    const rev = sales?.reduce((s, i) => s + i.paid_amount, 0) || 0
    setRevenue(rev)
    setTotalSales(sales?.length || 0)

    // 2. Bale costs for items sold in date range
    const { data: items } = await supabase
   .from('sales_items')
   .select('bale_id, sales!inner(created_at)')
   .gte('sales.created_at', dateFrom + 'T00:00:00')
   .lte('sales.created_at', dateTo + 'T23:59:59')
   .not('bale_id', 'is', null)

    const baleIds = [...new Set(items?.map(i => i.bale_id))]
    if (baleIds.length > 0) {
      const { data: bales } = await supabase
     .from('bales')
     .select('cost_price')
     .in('id', baleIds)
      const cost = bales?.reduce((s, b) => s + b.cost_price, 0) || 0
      setCosts(cost)
      setProfit(rev - cost)
    } else {
      setCosts(0)
      setProfit(rev)
    }

    setLoading(false)
  }

  const loadCustomers = async () => {
    const { data } = await supabase
   .from('customers')
   .select('*')
   .order('name')
    setCustomers(data || [])
  }

  const loadCustomerLedger = async () => {
    setLoading(true)
    const { data } = await supabase
   .from('sales')
   .select(`
      *,
      sales_items(item_description, original_price, paid_amount, status)
    `)
   .eq('customer_id', selectedCustomer)
   .order('created_at', { ascending: false })
   .limit(50)

    setCustomerSales(data || [])
    setLoading(false)
  }

  const loadCashierReport = async () => {
    setLoading(true)
    const { data } = await supabase
   .from('sales')
   .select('cashier_id, paid_amount, created_at')
   .gte('created_at', dateFrom + 'T00:00:00')
   .lte('created_at', dateTo + 'T23:59:59')

    // Group by cashier
    const grouped = data?.reduce((acc: any, sale) => {
      if (!acc[sale.cashier_id]) acc[sale.cashier_id] = { total: 0, count: 0 }
      acc[sale.cashier_id].total += sale.paid_amount
      acc[sale.cashier_id].count += 1
      return acc
    }, {}) || {}

    setCashiers(Object.entries(grouped).map(([id, data]: any) => ({ id,...data })))
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
        s.sales_items.map((i: any) =>
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Reports</h1>
        <button onClick={exportToCSV} className="bg-green-600 px-4 py-2 rounded-lg text-sm font-bold">
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-gray-800 p-1 rounded-xl">
        <button onClick={() => setTab('daily')} className={`flex-1 py-2 rounded-lg text-sm ${tab==='daily'?'bg-purple-600':'text-gray-400'}`}>Daily P&L</button>
        <button onClick={() => setTab('customers')} className={`flex-1 py-2 rounded-lg text-sm ${tab==='customers'?'bg-purple-600':'text-gray-400'}`}>Customers</button>
        <button onClick={() => setTab('cashiers')} className={`flex-1 py-2 rounded-lg text-sm ${tab==='cashiers'?'bg-purple-600':'text-gray-400'}`}>Cashiers</button>
      </div>

      {/* Date Filters */}
      <div className="flex gap-2 mb-4">
        <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="flex-1 bg-gray-800 p-2 rounded text-sm" />
        <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="flex-1 bg-gray-800 p-2 rounded text-sm" />
      </div>

      {/* DAILY P&L TAB */}
      {tab === 'daily' && (
        <div>
          {loading? <div className="text-center py-20 text-gray-500">Loading...</div> : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-800 p-4 rounded-xl">
                  <div className="text-gray-400 text-xs">REVENUE</div>
                  <div className="text-2xl font-bold text-green-400">KES {revenue.toLocaleString()}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl">
                  <div className="text-gray-400 text-xs">BALE COSTS</div>
                  <div className="text-2xl font-bold text-red-400">KES {costs.toLocaleString()}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl col-span-2 border-2 border-purple-600">
                  <div className="text-gray-400 text-xs">GROSS PROFIT</div>
                  <div className={`text-3xl font-bold ${profit >= 0? 'text-green-400' : 'text-red-400'}`}>
                    KES {profit.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Margin: {revenue > 0? ((profit/revenue)*100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span>Total Sales:</span>
                  <span className="font-bold">{totalSales} transactions</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span>Avg Sale:</span>
                  <span className="font-bold">KES {totalSales > 0? Math.round(revenue/totalSales).toLocaleString() : 0}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* CUSTOMER LEDGER TAB */}
      {tab === 'customers' && (
        <div>
          <select
            value={selectedCustomer}
            onChange={e=>setSelectedCustomer(e.target.value)}
            className="w-full bg-gray-800 p-3 rounded mb-4"
          >
            <option value="">Select Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
            ))}
          </select>

          {selectedCustomer && (
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="p-3 bg-gray-700 text-xs font-bold grid-cols-5 gap-2">
                <div>DATE</div>
                <div className="col-span-2">ITEM</div>
                <div className="text-right">PRICE</div>
                <div className="text-right">BAL</div>
              </div>
              {loading? <div className="p-8 text-center text-gray-500">Loading...</div> :
                customerSales.flatMap(s =>
                  s.sales_items.map((i: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-5 gap-2 p-3 border-b border-gray-700 text-sm">
                      <div className="text-xs">{new Date(s.created_at).toLocaleDateString('en-KE')}</div>
                      <div className="col-span-2 truncate">{i.item_description}</div>
                      <div className="text-right">KES {i.original_price}</div>
                      <div className={`text-right ${i.status==='Balance'?'text-orange-400':''}`}>
                        {i.original_price - i.paid_amount}
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
        <div className="space-y-3">
          {loading? <div className="text-center py-20 text-gray-500">Loading...</div> :
            cashiers.map((c, idx) => (
              <div key={idx} className="bg-gray-800 p-4 rounded-xl">
                <div className="flex justify-between">
                  <div>
                    <div className="font-bold">Cashier {idx + 1}</div>
                    <div className="text-xs text-gray-400">{c.count} sales</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">KES {c.total.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Avg: KES {Math.round(c.total/c.count).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around py-3">
        <button onClick={() => router.push('/sales/new')} className="text-gray-400 text-sm">📦 POS</button>
        <button onClick={() => router.push('/sales/my-sales')} className="text-gray-400 text-sm">📊 Sales</button>
        <button onClick={() => router.push('/bales')} className="text-gray-400 text-sm">📦 Bales</button>
        <button className="text-purple-400 font-bold text-sm">📈 Reports</button>
      </div>
    </div>
  )
}