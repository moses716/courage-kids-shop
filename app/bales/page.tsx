'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Package, Plus, Edit, Eye } from 'lucide-react'
import Navbar from '@/components/navbar'

type Bale = {
  id: string
  bale_name: string
  cost_price: number
  created_at: string
  status: string
  total_items: number
  items_sold: number
  revenue: number
}

export default function BalesPage() {
  const router = useRouter()
  const [bales, setBales] = useState<Bale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBales()
  }, [])

  const fetchBales = async () => {
    const { data: { user } = {} } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
   .from('bales')
   .select(`
        *,
        sales_items(count, original_price.sum())
      `)
   .eq('user_id', user.id)
   .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      const balesWithStats = (data || []).map((b: any) => ({
     ...b,
        items_sold: b.sales_items?.[0]?.count || 0,
        revenue: Number(b.sales_items?.[0]?.sum || 0)
      }))
      setBales(balesWithStats)
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 text-gray-900">Loading bales...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />
      <header className="bg-white shadow-sm px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Bales - COURAGE KIDS SHOP</h2>
          <button
            onClick={() => router.push('/bales/new')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium min-h-12 text-base"
          >
            <Plus size={20} />
            Add Bale
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6 w-full max-w-screen">
        <div className="max-w-6xl mx-auto">
          {bales.length === 0? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No bales yet</p>
              <button
                onClick={() => router.push('/bales/new')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-12 text-base"
              >
                Add First Bale
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="min-w-lg w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Bale Name</th>
                    <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Cost Price</th>
                    <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Items Sold</th>
                    <th className="border-gray-200 border-b px-4 py-3 text-right text-gray-900 font-semibold">Revenue</th>
                    <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Status</th>
                    <th className="border-gray-200 border-b px-4 py-3 text-center text-gray-900 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bales.map(bale => (
                    <tr key={bale.id} className="hover:bg-gray-50">
                      <td className="border-gray-200 border-b px-4 py-3 font-medium text-gray-900">{bale.bale_name}</td>
                      <td className="border-gray-200 border-b px-4 py-3 text-gray-900">KES {Number(bale.cost_price).toLocaleString()}</td>
                      <td className="border-gray-200 border-b px-4 py-3 text-gray-900">{bale.items_sold} / {bale.total_items}</td>
                      <td className="border-gray-200 border-b px-4 py-3 text-right font-semibold text-green-600">KES {bale.revenue.toLocaleString()}</td>
                      <td className="border-gray-200 border-b px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          bale.status === 'Open'? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {bale.status}
                        </span>
                      </td>
                      <td className="border-gray-200 border-b px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => router.push(`/bales/${bale.id}`)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-12 flex items-center gap-1 text-sm"
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/bales/${bale.id}/edit`)}
                            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 min-h-12 flex items-center gap-1 text-sm"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}