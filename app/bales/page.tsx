'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Settings, LogOut, Plus, Search, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function BalesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [bales, setBales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchBales()
  }, [])

  const fetchBales = async () => {
    // FIXED: Added } and ) here
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      router.push('/pos')
      return
    }
    
    setUserId(user.id)

    const { data, error } = await supabase
      .from('bales')
      .select('id, sku, name, category, grade, origin, weight_kg, cost_price, selling_price, qty_in_stock, low_stock_threshold, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    setBales(data || [])
    setLoading(false)
  }

  const filteredBales = bales.filter(b => 
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.sku?.toLowerCase().includes(search.toLowerCase()) ||
    b.category?.toLowerCase().includes(search.toLowerCase())
  )

  const lowStockBales = bales.filter(b => b.qty_in_stock <= b.low_stock_threshold)

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: ShoppingCart, label: 'Sales', href: '/sales' },
    { icon: Package, label: 'Bales', href: '/bales', active: true },
    { icon: Users, label: 'Customers', href: '/customers' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading bales...</p>
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
            <h2 className="text-2xl font-bold text-gray-800">Bales / Products</h2>
            <Link 
              href="/bales/new"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus size={18} />
              Add Bale
            </Link>
          </div>
        </header>

        <main className="p-6">
          {/* Low Stock Alert */}
          {lowStockBales.length > 0 && (
            <div className="bg-orange-50 border-orange-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="text-orange-600" size={24} />
              <div>
                <p className="font-semibold text-orange-800">Low Stock Alert</p>
                <p className="text-sm text-orange-600">{lowStockBales.length} bale(s) are below threshold</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex items-center gap-2">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by Name, SKU, or Category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 outline-none"
              />
            </div>
          </div>

          {/* Bales Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold">SKU</th>
                    <th className="text-left py-4 px-6 font-semibold">Name</th>
                    <th className="text-left py-4 px-6 font-semibold">Category</th>
                    <th className="text-left py-4 px-6 font-semibold">Grade</th>
                    <th className="text-left py-4 px-6 font-semibold">Weight</th>
                    <th className="text-left py-4 px-6 font-semibold">Cost</th>
                    <th className="text-left py-4 px-6 font-semibold">Selling Price</th>
                    <th className="text-left py-4 px-6 font-semibold">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        No bales found. <Link href="/bales/new" className="text-green-600">Add your first bale</Link>
                      </td>
                    </tr>
                  ) : (
                    filteredBales.map((bale) => {
                      const isLowStock = bale.qty_in_stock <= bale.low_stock_threshold
                      return (
                        <tr key={bale.id} className={`border-b hover:bg-gray-50 ${isLowStock ? 'bg-orange-50' : ''}`}>
                          <td className="py-4 px-6 font-mono text-xs">{bale.sku || '-'}</td>
                          <td className="py-4 px-6 font-medium">{bale.name}</td>
                          <td className="py-4 px-6">{bale.category || '-'}</td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{bale.grade || '-'}</span>
                          </td>
                          <td className="py-4 px-6">{bale.weight_kg ? `${bale.weight_kg}kg` : '-'}</td>
                          <td className="py-4 px-6">Ksh {Number(bale.cost_price).toLocaleString()}</td>
                          <td className="py-4 px-6 font-semibold">Ksh {Number(bale.selling_price).toLocaleString()}</td>
                          <td className="py-4 px-6">
                            <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                              {bale.qty_in_stock}
                            </span>
                            {isLowStock && <span className="ml-2 text-xs text-red-500">Low!</span>}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-500 text-sm">Total Bales</p>
              <p className="text-2xl font-bold">{bales.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-500 text-sm">Total Stock Qty</p>
              <p className="text-2xl font-bold">{bales.reduce((sum, b) => sum + b.qty_in_stock, 0)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-500 text-sm">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockBales.length}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}