'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Settings, LogOut, Plus, Search } from 'lucide-react'
import Link from 'next/link'

export default function SalesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    // FIXED: Added } and ) here
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      router.push('/pos')
      return
    }
    
    setUserId(user.id)

    const { data, error } = await supabase
      .from('sales')
      .select('id, invoice_no, customer_phone, total_amount, discount, payment_method, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    setSales(data || [])
    setLoading(false)
  }

  const filteredSales = sales.filter(s => 
    s.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_phone?.toLowerCase().includes(search.toLowerCase())
  )

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: ShoppingCart, label: 'Sales', href: '/sales', active: true },
    { icon: Package, label: 'Bales', href: '/bales' },
    { icon: Users, label: 'Customers', href: '/customers' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading sales...</p>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
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

      {/* Main */}
      <div className="flex-1">
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Sales</h2>
            <Link 
              href="/sales/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              New Sale
            </Link>
          </div>
        </header>

        <main className="p-6">
          {/* Search */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex items-center gap-2">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by Invoice No or Customer Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 outline-none"
              />
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold">Invoice No</th>
                    <th className="text-left py-4 px-6 font-semibold">Customer Phone</th>
                    <th className="text-left py-4 px-6 font-semibold">Total</th>
                    <th className="text-left py-4 px-6 font-semibold">Discount</th>
                    <th className="text-left py-4 px-6 font-semibold">Payment</th>
                    <th className="text-left py-4 px-6 font-semibold">Date</th>
                    <th className="text-left py-4 px-6 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        No sales found. <Link href="/sales/new" className="text-blue-600">Create your first sale</Link>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium">{sale.invoice_no}</td>
                        <td className="py-4 px-6">{sale.customer_phone || '-'}</td>
                        <td className="py-4 px-6 font-semibold">Ksh {Number(sale.total_amount).toLocaleString()}</td>
                        <td className="py-4 px-6">Ksh {Number(sale.discount).toLocaleString()}</td>
                        <td className="py-4 px-6 capitalize">{sale.payment_method}</td>
                        <td className="py-4 px-6">{new Date(sale.created_at).toLocaleDateString()}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            sale.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
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

          {/* Summary */}
          <div className="mt-6 text-right text-gray-600">
            Total Sales: <span className="font-bold text-gray-800">Ksh {filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0).toLocaleString()}</span>
          </div>
        </main>
      </div>
    </div>
  )
}