'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Package, Plus, Edit, Eye } from 'lucide-react'
import Navbar from '@/components/navbar'

type Bale = {
  id: string
  bale_name: string
  bale_type: string
  cost_price: number
  weight_kg: number
  date_received: string
  status: string
  total_items_estimated: number
  created_at: string
  user_id: string
}

export default function BalesPage() {
  const router = useRouter()
  const [bales, setBales] = useState<Bale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBales()
  }, [])

  const fetchBales = async () => {
  try {
    const { data } = await supabase.auth.getUser()
    const user = data.user
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: balesData, error } = await supabase
      .from('bales')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      setError(error.message)
    } else {
      setBales(balesData || [])
    }
  } catch (err: any) {
    console.error(err)
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': 
      case 'active': return 'bg-green-100 text-green-700'
      case 'finished': return 'bg-gray-100 text-gray-700'
      default: return 'bg-yellow-100 text-yellow-700'
    }
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
      <header className="bg-white shadow-sm px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Bales Management</h2>
            <p className="text-sm text-gray-500">COURAGE KIDS SHOP</p>
          </div>
          <button
            onClick={() => router.push('/bales/new')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium min-h-12 text-base"
          >
            <Plus size={20} />
            Add Bale
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6 w-full">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="bg-red-50 border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">Error: {error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{bales.length}</p>
              <p className="text-xs text-gray-500">Total Bales</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4">
              <p className="text-2xl font-bold text-green-600">{bales.filter(b => b.status === 'Open' || b.status === 'active').length}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4">
              <p className="text-2xl font-bold text-blue-600">{bales.reduce((sum, b) => sum + (b.total_items_estimated || 0), 0)}</p>
              <p className="text-xs text-gray-500">Total Items Est</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">KES {bales.reduce((sum, b) => sum + (b.cost_price || 0), 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Cost</p>
            </div>
          </div>

          {bales.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border-gray-200 p-12 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium mb-2">No bales yet</p>
              <p className="text-sm text-gray-500 mb-6">Add your first bale to start tracking inventory</p>
              <button
                onClick={() => router.push('/bales/new')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-12 text-base"
              >
                Add First Bale
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="grid gap-3 sm:hidden">
                {bales.map(bale => (
                  <div key={bale.id} className="bg-white rounded-xl shadow-sm border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{bale.bale_name}</p>
                        <p className="text-sm text-gray-500">{bale.bale_type}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(bale.status)}`}>
                        {bale.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Cost Price</p>
                        <p className="font-semibold text-gray-900">KES {Number(bale.cost_price).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Items Est</p>
                        <p className="font-semibold text-gray-900">{bale.total_items_estimated}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Weight</p>
                        <p className="font-semibold text-gray-900">{bale.weight_kg} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Received</p>
                        <p className="font-semibold text-gray-900">{bale.date_received ? new Date(bale.date_received).toLocaleDateString() : '-'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/bales/${bale.id}`)}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-12 flex items-center justify-center gap-1 text-sm"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/bales/${bale.id}/edit`)}
                        className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 min-h-12 flex items-center justify-center gap-1 text-sm"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block bg-white rounded-xl shadow-sm border-gray-200 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-b border-gray-200 px-4 py-3 text-left text-gray-900 font-semibold">Bale Name</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-left text-gray-900 font-semibold">Type</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-left text-gray-900 font-semibold">Cost Price</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-left text-gray-900 font-semibold">Items Est</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-left text-gray-900 font-semibold">Weight</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-left text-gray-900 font-semibold">Status</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-center text-gray-900 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bales.map(bale => (
                      <tr key={bale.id} className="hover:bg-gray-50">
                        <td className="border-b border-gray-200 px-4 py-3 font-medium text-gray-900">{bale.bale_name}</td>
                        <td className="border-b border-gray-200 px-4 py-3 text-gray-700">{bale.bale_type}</td>
                        <td className="border-b border-gray-200 px-4 py-3 text-gray-900">KES {Number(bale.cost_price).toLocaleString()}</td>
                        <td className="border-b border-gray-200 px-4 py-3 text-gray-900">{bale.total_items_estimated}</td>
                        <td className="border-b border-gray-200 px-4 py-3 text-gray-900">{bale.weight_kg} kg</td>
                        <td className="border-b border-gray-200 px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(bale.status)}`}>
                            {bale.status}
                          </span>
                        </td>
                        <td className="border-b border-gray-200 px-4 py-3">
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
            </>
          )}
        </div>
      </main>
    </div>
  )
}