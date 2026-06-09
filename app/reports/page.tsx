'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Download, Calendar, TrendingUp, DollarSign, Users, UserCheck, FileText } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  const [customerSales, setCustomerSales] = useState<any[]>([])
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
    const { data: sales } = await supabase
.from('sales')
.select('paid_amount, total_amount')
.gte('created_at', dateFrom + 'T00:00:00')
.lte('created_at', dateTo + 'T23:59:59')

    const rev = sales?.reduce((s, i) => s + (i.paid_amount || 0), 0) || 0
    setRevenue(rev)
    setTotalSales(sales?.length || 0)

    const { data: items } = await supabase
.from('sales_items')
.select('bale_id, sales!inner(created_at)')
.gte('sales.created_at', dateFrom + 'T00:00:00')
.lte('sales.created_at', dateTo + 'T23:59:59')
.not('bale_id', 'is', null)

    const baleIds = [...new Set(items?.map(i => i.bale_id).filter(Boolean))]
    if (baleIds.length > 0) {
      const { data: bales } = await supabase.from('bales').select('cost_price').in('id', baleIds)
      const cost = bales?.reduce((s, b) => s + (b.cost_price || 0), 0) || 0
      setCosts(cost)
      setProfit(rev - cost)
    } else {
      setCosts(0)
      setProfit(rev)
    }
    setLoading(false)
  }

  const loadCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').eq('is_active', true).order('name')
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
    setCustomerSales(data || [])
    setLoading(false)
  }

  const loadCashierReport = async () => {
    setLoading(true)
    const { data } = await supabase
.from('sales')
.select('user_id, paid_amount, created_at')
.gte('created_at', dateFrom + 'T00:00:00')
.lte('created_at', dateTo + 'T23:59:59')

    const grouped = data?.reduce((acc: any, sale) => {
      if (!acc[sale.user_id]) acc[sale.user_id] = { total: 0, count: 0 }
      acc[sale.user_id].total += sale.paid_amount || 0
      acc[sale.user_id].count += 1
      return acc
    }, {}) || {}

    setCashiers(Object.entries(grouped).map(([id, data]: any) => ({ id,...data })))
    setLoading(false)
  }

  const exportToCSV = () => {
    const csv = `Date From,Date To,Revenue,Costs,Profit,Total Sales,Margin%\n${dateFrom},${dateTo},${revenue},${costs},${profit},${totalSales},${margin}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${dateFrom}_to_${dateTo}.csv`
    a.click()
  }

  const margin = revenue > 0? ((profit/revenue)*100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-4 pb-28 space-y-5">

        {/* HEADER - SOLID BG */}
        <div className="bg-gray-800 rounded-xl border-gray-700 p-4 relative z-30">
          <div className="flex items-center gap-3 mb-3">
            <FileText size={24} className="text-purple-400" />
            <h1 className="text-xl font-semibold">Reports</h1>
          </div>

          <div className="flex gap-2 bg-gray-900 p-1 rounded-lg">
            <button
              onClick={() => setTab('daily')}
              className={`flex-1 py-2 rounded text-sm font-medium transition ${
                tab==='daily'? 'bg-purple-600 text-white' : 'text-gray-400'
              }`}
            >
              Daily P&L
            </button>
            <button
              onClick={() => setTab('customers')}
              className={`flex-1 py-2 rounded text-sm font-medium transition ${
                tab==='customers'? 'bg-purple-600 text-white' : 'text-gray-400'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setTab('cashiers')}
              className={`flex-1 py-2 rounded text-sm font-medium transition ${
                tab==='cashiers'? 'bg-purple-600 text-white' : 'text-gray-400'
              }`}
            >
              Cashiers
            </button>
          </div>
        </div>

        {/* FILTERS - SOLID BG + MORE PADDING */}
        <div className="bg-gray-800 rounded-xl border-gray-700 p-5 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Date From */}
            <div className="relative z-10">
              <label className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">Date From</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e=>setDateFrom(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gray-700 border-gray-600 rounded-lg text-base text-white focus:ring-2 focus:ring-purple-500 outline-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="relative z-10">
              <label className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">Date To</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={e=>setDateTo(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gray-700 border-gray-600 rounded-lg text-base text-white focus:ring-2 focus:ring-purple-500 outline-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
              </div>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-4 rounded-lg text-base font-semibold flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT - SOLID CARDS */}
        {loading? (
          <div className="bg-gray-800 rounded-xl border-gray-700 p-12 text-center relative z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : (
          <>
            {tab === 'daily' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded-xl border-gray-700 p-6 relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign size={20} className="text-green-400" />
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Revenue</p>
                    </div>
                    <p className="text-3xl font-bold">KES {revenue.toLocaleString()}</p>
                  </div>

                  <div className="bg-gray-800 rounded-xl border-gray-700 p-6 relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign size={20} className="text-red-400" />
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Costs</p>
                    </div>
                    <p className="text-3xl font-bold">KES {costs.toLocaleString()}</p>
                  </div>

                  <div className="bg-purple-900 rounded-xl border-purple-700 p-6 relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={20} className="text-purple-300" />
                      <p className="text-xs font-medium text-purple-200 uppercase tracking-wide">Gross Profit</p>
                    </div>
                    <p className={`text-3xl font-bold ${profit >= 0? 'text-green-400' : 'text-red-400'}`}>
                      KES {profit.toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-300 mt-2">Margin: {margin}%</p>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl border-gray-700 p-5 relative z-10">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Total Sales</p>
                      <p className="font-semibold text-lg">{totalSales} transactions</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Average Sale</p>
                      <p className="font-semibold text-lg">KES {totalSales > 0? Math.round(revenue/totalSales).toLocaleString() : 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'customers' && (
              <div className="bg-gray-800 rounded-xl border-gray-700 p-5 relative z-10">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Users size={16} className="inline mr-2" />
                  Select Customer
                </label>
                <select
                  value={selectedCustomer}
                  onChange={e=>setSelectedCustomer(e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-3 text-base text-white focus:ring-2 focus:ring-purple-500 outline-none mb-4"
                >
                  <option value="">Choose customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                </select>

                {selectedCustomer && customerSales.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-700">
                        <tr>
                          <th className="text-left py-3 px-3 font-medium text-gray-400">Date</th>
                          <th className="text-left py-3 px-3 font-medium text-gray-400">Item</th>
                          <th className="text-right py-3 px-3 font-medium text-gray-400">Price</th>
                          <th className="text-right py-3 px-3 font-medium text-gray-400">Paid</th>
                          <th className="text-right py-3 px-3 font-medium text-gray-400">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerSales.flatMap(s =>
                          s.sales_items.map((i: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-700">
                              <td className="py-3 px-3 text-gray-300">{new Date(s.created_at).toLocaleDateString()}</td>
                              <td className="py-3 px-3">{i.item_description}</td>
                              <td className="py-3 px-3 text-right">KES {i.original_price.toLocaleString()}</td>
                              <td className="py-3 px-3 text-right">KES {i.paid_amount.toLocaleString()}</td>
                              <td className={`py-3 px-3 text-right font-medium ${i.original_price - i.paid_amount > 0? 'text-orange-400' : 'text-green-400'}`}>
                                KES {(i.original_price - i.paid_amount).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'cashiers' && (
              <div className="space-y-3">
                {cashiers.map((c, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-xl border-gray-700 p-5 relative z-10">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <UserCheck size={24} className="text-purple-400" />
                        <div>
                          <p className="font-semibold text-lg">Cashier {idx + 1}</p>
                          <p className="text-sm text-gray-400">{c.count} sales</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">KES {c.total.toLocaleString()}</p>
                        <p className="text-sm text-gray-400">Avg: KES {Math.round(c.total/c.count).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-40">
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