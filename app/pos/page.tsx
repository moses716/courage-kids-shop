'use client'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Settings, LogOut, DollarSign } from 'lucide-react'
import Link from 'next/link'

type Sale = {
  id: string
  created_at: string
  total_amount: number
  status: string
  customers: { phone: string } | null
}

type Stats = {
  todaySales: number
  weeklySales: number
  totalBales: number
  totalCustomers: number
  itemsLeft: number  // Added this
}

export default function Dashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [sessionLoading, setSessionLoading] = useState<boolean>(false)
  const [sessionOpen, setSessionOpen] = useState<boolean>(false)
  const [stats, setStats] = useState<Stats>({
    todaySales: 0,
    weeklySales: 0,
    totalBales: 0,
    totalCustomers: 0,
    itemsLeft: 0  // Added this
  })
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    init()
  }, [])

  const init = async (): Promise<void> => {
    const { data } = await supabase.auth.getUser()
    const user = data.user
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUserEmail(user.email || '')
    await checkSession(user.id)
    setLoading(false)
  }

  const checkSession = async (userId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('pos_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .maybeSingle()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Session check error:', error)
    }
    
    setSessionOpen(!!data)
    
    if (data) {
      await fetchData(userId)
    }
  }

  const startSession = async (): Promise<void> => {
    setSessionLoading(true)
    const { data } = await supabase.auth.getUser()
    const user = data.user
    
    if (!user) {
      alert('Not logged in')
      router.push('/login')
      setSessionLoading(false)
      return
    }

    const { data: sessionData, error } = await supabase.from('pos_sessions').insert({
      user_id: user.id,
      opening_cash: 0,
      status: 'open',
      opened_at: new Date().toISOString()
    }).select().single()
    
    if (error) {
      alert('Error starting session: ' + error.message)
      console.error('Start session error:', error)
      setSessionLoading(false)
      return
    }
    
    setSessionOpen(true)
    await fetchData(user.id)
    setSessionLoading(false)
  }

  const fetchData = async (userId: string): Promise<void> => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [todaySales, weeklySales, bales, customers, sales, balesData] = await Promise.all([
      supabase.from('sales').select('total_amount').gte('created_at', today.toISOString()).eq('status', 'completed').eq('user_id', userId),
      supabase.from('sales').select('total_amount').gte('created_at', weekAgo.toISOString()).eq('status', 'completed').eq('user_id', userId),
      supabase.from('bales').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('sales').select('id, created_at, total_amount, status, customers(phone)').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      // ADDED: Fetch bales with stock data
      supabase.from('bales').select('items_est, items_sold').eq('user_id', userId).eq('status', 'Open')
    ])

    const todayTotal = todaySales.data?.reduce((sum: number, s: { total_amount: number }) => sum + Number(s.total_amount), 0) || 0
    const weekTotal = weeklySales.data?.reduce((sum: number, s: { total_amount: number }) => sum + Number(s.total_amount), 0) || 0

    // ADDED: Calculate total items left
    const itemsLeft = balesData.data?.reduce((sum: number, bale: { items_est: number | null, items_sold: number | null }) => {
      const est = bale.items_est ?? 0
      const sold = bale.items_sold ?? 0
      return sum + Math.max(0, est - sold)
    }, 0) ?? 0

    setStats({
      todaySales: todayTotal,
      weeklySales: weekTotal,
      totalBales: bales.count || 0,
      totalCustomers: customers.count || 0,
      itemsLeft: itemsLeft  // Added this
    })
    
    setRecentSales((sales.data as Sale[]) || [])
  }

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatDate = (dateString: string): string => {
    if (!mounted) return ''
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/pos', active: true },
    { icon: ShoppingCart, label: 'Sales', href: '/sales/my-sales', active: false },
    { icon: Package, label: 'Bales', href: '/bales', active: false },
    { icon: Users, label: 'Customers', href: '/customers', active: false },
    { icon: BarChart3, label: 'Reports', href: '/reports', active: false },
    { icon: Settings, label: 'Settings', href: '/settings', active: false },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <aside className="w-64 bg-white shadow-lg hidden md:block">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Courage Kids POS</h1>
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

      <div className="flex-1 w-full max-w-screen overflow-x-hidden">
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">{userEmail}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition min-h-12 text-base"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 w-full">
          {!sessionOpen ? (
            <div className="bg-white rounded-xl shadow p-8 sm:p-12 text-center mt-10 sm:mt-20 max-w-md mx-auto">
              <div className="text-6xl mb-6">💰</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">No Active Session</h2>
              <p className="text-gray-600 mb-8">Click below to start selling</p>
              <button 
                onClick={startSession}
                disabled={sessionLoading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-10 py-4 rounded-lg font-bold text-base sm:text-lg shadow-lg w-full min-h-12"
              >
                {sessionLoading ? 'Opening Session...' : 'Start Session'}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
                <StatCard icon={DollarSign} title="Today's Sales" value={`Ksh ${stats.todaySales.toLocaleString()}`} color="green" />
                <StatCard icon={ShoppingCart} title="Weekly Sales" value={`Ksh ${stats.weeklySales.toLocaleString()}`} color="blue" />
                <StatCard icon={Package} title="Total Bales" value={stats.totalBales.toString()} color="purple" />
                <StatCard icon={Users} title="Customers" value={stats.totalCustomers.toString()} color="orange" />
                <StatCard icon={Package} title="Items Left" value={stats.itemsLeft.toLocaleString()} color="indigo" />
              </div>

              <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link href="/sales/new" className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition text-center min-h-12 flex items-center justify-center">+ New Sale</Link>
                  <Link href="/bales/new" className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition text-center min-h-12 flex items-center justify-center">+ Add Bale</Link>
                  <Link href="/reports" className="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition text-center min-h-12 flex items-center justify-center">View Reports</Link>
                  <Link href="/bales" className="p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition text-center min-h-12 flex items-center justify-center">Manage Stock</Link>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4 sm:p-6 overflow-x-auto">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Recent Sales</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-lg w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 text-gray-900">Customer Phone</th>
                        <th className="text-left py-3 px-4 text-gray-900">Amount</th>
                        <th className="text-left py-3 px-4 text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.length === 0 ? (
                        <tr className="border-t">
                          <td colSpan={4} className="text-center py-8 text-gray-400">
                            No sales yet. Click + New Sale to start!
                          </td>
                        </tr>
                      ) : (
                        recentSales.map((sale) => (
                          <tr key={sale.id} className="border-t hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-900" suppressHydrationWarning>{formatDate(sale.created_at)}</td>
                            <td className="py-3 px-4 text-gray-900">{sale.customers?.phone || '-'}</td>
                            <td className="py-3 px-4 font-semibold text-gray-900">Ksh {Number(sale.total_amount).toLocaleString()}</td>
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
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, color }: { icon: any; title: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
    indigo: 'text-indigo-600 bg-indigo-100'  // Added for Items Left
  }
  
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}