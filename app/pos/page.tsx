'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Settings, LogOut, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todaySales: 0,
    weeklySales: 0,
    totalBales: 0,
    totalCustomers: 0
  })
  const [recentSales, setRecentSales] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // FIXED: Added } and ) here
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      router.push('/pos')
      return
    }
    
    setUserEmail(user.email || '')
    setUserId(user.id)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [todaySales, weeklySales, bales, customers, sales] = await Promise.all([
      supabase.from('sales').select('total_amount').eq('user_id', user.id).gte('created_at', today.toISOString()).eq('status', 'completed'),
      supabase.from('sales').select('total_amount').eq('user_id', user.id).gte('created_at', weekAgo.toISOString()).eq('status', 'completed'),
      supabase.from('bales').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('sales').select('invoice_no, customer_phone, total_amount, created_at, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    ])

    const todayTotal = todaySales.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
    const weekTotal = weeklySales.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0

    setStats({
      todaySales: todayTotal,
      weeklySales: weekTotal,
      totalBales: bales.count || 0,
      totalCustomers: customers.count || 0
    })
    
    setRecentSales(sales.data || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/pos')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: ShoppingCart, label: 'Sales', href: '/sales', active: false },
    { icon: Package, label: 'Bales', href: '/bales', active: false },
    { icon: Users, label: 'Customers', href: '/customers', active: false },
    { icon: BarChart3, label: 'Reports', href: '/reports', active: false },
    { icon: Settings, label: 'Settings', href: '/settings', active: false },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-lg hidden md:block">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Watoto POS</h1>
          <p className="text-xs text-gray-500 mt-1">Kids Clothing Store</p>
        </div>
        <nav className="p-4">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                item.active 
                  ? 'bg-blue-50 text-blue-600 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">{userEmail}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={DollarSign} title="Today's Sales" value={`Ksh ${stats.todaySales.toLocaleString()}`} color="green" />
            <StatCard icon={ShoppingCart} title="Weekly Sales" value={`Ksh ${stats.weeklySales.toLocaleString()}`} color="blue" />
            <StatCard icon={Package} title="Total Bales" value={stats.totalBales.toString()} color="purple" />
            <StatCard icon={Users} title="Customers" value={stats.totalCustomers.toString()} color="orange" />
          </div>

          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/sales/new" className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition text-center">+ New Sale</Link>
              <Link href="/bales/new" className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition text-center">+ Add Bale</Link>
              <Link href="/reports" className="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition text-center">View Reports</Link>
              <Link href="/bales" className="p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition text-center">Manage Stock</Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold mb-4">Recent Sales</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4">Invoice No</th>
                    <th className="text-left py-3 px-4">Customer Phone</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Time</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.length === 0 ? (
                    <tr className="border-t">
                      <td colSpan={5} className="text-center py-8 text-gray-400">
                        No sales yet. Start selling now!
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((sale) => (
                      <tr key={sale.invoice_no} className="border-t hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{sale.invoice_no}</td>
                        <td className="py-3 px-4">{sale.customer_phone || '-'}</td>
                        <td className="py-3 px-4 font-semibold">Ksh {Number(sale.total_amount).toLocaleString()}</td>
                        <td className="py-3 px-4">{new Date(sale.created_at).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            sale.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, color }: any) {
  const colors: any = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  }
  
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}