'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ShoppingBag, Users, DollarSign, Package, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [stats, setStats] = useState({
    todaySales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchStats()
  }, [])

  const checkAuth = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser() // FIXED
    if (authError ||!user) router.push('/login')
  }

  const fetchStats = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser() // FIXED
    if (authError ||!user) return

    const today = new Date().toISOString().split('T')[0]

    // Today's sales
    const { data: sales } = await supabase
     .from('sales')
     .select('total_amount')
     .eq('user_id', user.id)
     .gte('created_at', today)

    // Total customers
    const { count: customerCount } = await supabase
     .from('customers')
     .select('*', { count: 'exact', head: true })
     .eq('user_id', user.id)

    // Total products/bales
    const { count: productCount } = await supabase
     .from('products')
     .select('*', { count: 'exact', head: true })
     .eq('user_id', user.id)

    // All time revenue
    const { data: allSales } = await supabase
     .from('sales')
     .select('total_amount')
     .eq('user_id', user.id)

    setStats({
      todaySales: sales?.length || 0,
      totalCustomers: customerCount || 0,
      totalProducts: productCount || 0,
      totalRevenue: allSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
    })
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading dashboard...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">COURAGE KIDS SHOP Dashboard</h1>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <p className="text-gray-600 mb-6">Karibu! Here's your shop overview</p>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={32} className="text-green-600" />
              <span className="text-xs text-gray-500">Today</span>
            </div>
            <p className="text-sm text-gray-500">Sales</p>
            <p className="text-3xl font-bold">{stats.todaySales}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users size={32} className="text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-3xl font-bold">{stats.totalCustomers}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Package size={32} className="text-purple-600" />
            </div>
            <p className="text-sm text-gray-500">Products/Bales</p>
            <p className="text-3xl font-bold">{stats.totalProducts}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag size={32} className="text-orange-600" />
              <span className="text-xs text-gray-500">All time</span>
            </div>
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              Ksh {stats.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            <Link href="/pos"
              className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition text-center">
              <ShoppingBag size={32} className="mx-auto mb-2 text-blue-600" />
              <p className="font-medium">New Sale</p>
            </Link>

            <Link href="/customers/new"
              className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition text-center">
              <Users size={32} className="mx-auto mb-2 text-green-600" />
              <p className="font-medium">Add Customer</p>
            </Link>

            <Link href="/bales/new"
              className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-center">
              <Package size={32} className="mx-auto mb-2 text-purple-600" />
              <p className="font-medium">Add Bale</p>
            </Link>

            <Link href="/customers"
              className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition text-center">
              <Users size={32} className="mx-auto mb-2 text-orange-600" />
              <p className="font-medium">View Customers</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}