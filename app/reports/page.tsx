'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client' // FIXED: same client as Settings/NewSale
import { Calendar, TrendingUp, Package, Truck, Download } from 'lucide-react'

type Sale = {
  id: string
  invoice_no: string
  customer_phone: string
  total_amount: number
  discount: number
  created_at: string
  payment_method: string
  user_id: string
}

type DailyReport = {
  date: string
  total_sales: number
  total_orders: number
  cash_sales: number
  mpesa_sales: number
}

export default function ReportsPage() {
  const supabase = createClient()
  const [sales, setSales] = useState<Sale[]>([])
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(thirtyDaysAgo)
  const [endDate, setEndDate] = useState(today)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data } = await supabase.auth.getUser()
    const user = data?.user
    if (!user) return
    setUserId(user.id)
    fetchReports(user.id)
  }

  const fetchReports = async (uid: string) => {
    setLoading(true)

    const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('user_id', uid) // FIXED: only Maggie's sales
    .gte('created_at', `${startDate}T00:00:00`)
    .lte('created_at', `${endDate}T23:59:59`)
    .order('created_at', { ascending: false })

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }

    setSales(data || [])
    setDailyReports(groupByDate(data || []))
    setLoading(false)
  }

  useEffect(() => {
    if (userId) fetchReports(userId)
  }, [startDate, endDate, userId])

  const groupByDate = (sales: Sale[]): DailyReport[] => {
    const grouped: Record<string, DailyReport> = {}

    sales.forEach(sale => {
      const date = new Date(sale.created_at).toISOString().split('T')[0] // YYYY-MM-DD
      if (!grouped[date]) {
        grouped[date] = {
          date,
          total_sales: 0,
          total_orders: 0,
          cash_sales: 0,
          mpesa_sales: 0
        }
      }
      grouped[date].total_sales += sale.total_amount
      grouped[date].total_orders += 1

      if (sale.payment_method === 'cash') {
        grouped[date].cash_sales += sale.total_amount
      } else if (sale.payment_method === 'mpesa') {
        grouped[date].mpesa_sales += sale.total_amount
      }
    })

    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date))
  }

  const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0)
  const totalOrders = sales.length
  const totalCash = sales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + s.total_amount, 0)
  const totalMpesa = sales.filter(s => s.payment_method === 'mpesa').reduce((sum, s) => sum + s.total_amount, 0)
  const avgOrder = totalOrders > 0? totalSales / totalOrders : 0

  const exportCSV = () => {
    const headers = ['Date', 'Orders', 'Total Sales Ksh', 'Cash Ksh', 'M-Pesa Ksh', 'Avg Order Ksh']
    const rows = dailyReports.map(r => [
      r.date,
      r.total_orders,
      r.total_sales,
      r.cash_sales,
      r.mpesa_sales,
      Math.round(r.total_sales / r.total_orders)
    ])
    const csv = [headers,...rows].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `COURAGE-KIDS-Report-${startDate}-to-${endDate}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-6">Loading reports...</div>

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">COURAGE KIDS SHOP - Reports</h1>

          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button
              onClick={exportCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow border-gray-200 p-6">
            <div className="flex items-center gap-3 text-gray-500 text-sm mb-2">
              <TrendingUp size={18} /> Total Revenue
            </div>
            <p className="text-3xl font-bold">Ksh {totalSales.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow border-gray-200 p-6">
            <div className="flex items-center gap-3 text-gray-500 text-sm mb-2">
              <Package size={18} /> Total Orders
            </div>
            <p className="text-3xl font-bold">{totalOrders}</p>
          </div>

          <div className="bg-white rounded-xl shadow border-gray-200 p-6">
            <div className="flex items-center gap-3 text-gray-500 text-sm mb-2">
              <Truck size={18} /> Cash Sales
            </div>
            <p className="text-3xl font-bold">Ksh {totalCash.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow border-gray-200 p-6">
            <div className="flex items-center gap-3 text-gray-500 text-sm mb-2">
              <Calendar size={18} /> Avg Order
            </div>
            <p className="text-3xl font-bold">Ksh {avgOrder.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
          </div>
        </div>

        {/* Daily Breakdown Table */}
        <div className="bg-white rounded-xl shadow border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-semibold">Date</th>
                <th className="text-right p-4 text-sm font-semibold">Orders</th>
                <th className="text-right p-4 text-sm font-semibold">Total Ksh</th>
                <th className="text-right p-4 text-sm font-semibold">Cash Ksh</th>
                <th className="text-right p-4 text-sm font-semibold">M-Pesa Ksh</th>
                <th className="text-right p-4 text-sm font-semibold">Avg Order</th>
              </tr>
            </thead>
            <tbody>
              {dailyReports.length === 0? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400">No sales in this period</td></tr>
              ) : dailyReports.map(report => (
                <tr key={report.date} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">
                    {new Date(report.date).toLocaleDateString('en-KE', {weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'})}
                  </td>
                  <td className="p-4 text-right">{report.total_orders}</td>
                  <td className="p-4 text-right font-bold">Ksh {report.total_sales.toLocaleString()}</td>
                  <td className="p-4 text-right">Ksh {report.cash_sales.toLocaleString()}</td>
                  <td className="p-4 text-right text-blue-600">Ksh {report.mpesa_sales.toLocaleString()}</td>
                  <td className="p-4 text-right">Ksh {Math.round(report.total_sales / report.total_orders).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}