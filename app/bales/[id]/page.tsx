'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Package, DollarSign, TrendingUp } from 'lucide-react'
import Navbar from '@/components/navbar'

type Bale = {
  id: string
  bale_name: string
  bale_type: string
  cost_price: number
  total_items_estimated: number
  weight_kg: number
  status: string
  created_at: string
}

type SoldItem = {
  id: string
  item_description: string
  original_price: number
  paid_amount: number
  status: string
  created_at: string
  sales: {
    customers: { name: string, phone: string }
  }
}

export default function BaleDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const baleId = params.id as string

  const [bale, setBale] = useState<Bale | null>(null)
  const [soldItems, setSoldItems] = useState<SoldItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (baleId) {
      fetchBaleDetails()
    }
  }, [baleId])

  const fetchBaleDetails = async () => {
    try {
      const { data } = await supabase.auth.getUser()
      const user = data.user

      if (!user) {
        router.push('/login')
        return
      }

      // Get bale info
      const { data: baleData, error: baleError } = await supabase
       .from('bales')
       .select('*')
       .eq('id', baleId)
       .eq('user_id', user.id)
       .single()

      if (baleError) {
        setError(baleError.message)
        setLoading(false)
        return
      }
      setBale(baleData)

      // Get all items sold from this bale
      const { data: itemsData, error: itemsError } = await supabase
       .from('sales_items')
       .select(`
          id,
          item_description,
          original_price,
          paid_amount,
          status,
          created_at,
          sales!inner(customers(name, phone))
        `)
       .eq('bale_id', baleId)
       .order('created_at', { ascending: false })

      if (itemsError) console.error('Items error:', itemsError)
      setSoldItems(itemsData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 text-gray-900 flex items-center justify-center">Loading bale details...</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6">
        <div className="bg-red-50 border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
          <button onClick={() => router.push('/bales')} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg">Back to Bales</button>
        </div>
      </div>
    </div>
  )

  if (!bale) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 text-center">
        <p className="text-gray-900 mb-4">Bale not found</p>
        <button onClick={() => router.push('/bales')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Back to Bales</button>
      </div>
    </div>
  )

  const totalRevenue = soldItems.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0)
  const totalSold = soldItems.length
  const remainingItems = (bale.total_items_estimated || 0) - totalSold
  const profit = totalRevenue - Number(bale.cost_price || 0)
  const profitMargin = totalRevenue > 0? ((profit / totalRevenue) * 100).toFixed(1) : '0'

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'cleared': return 'bg-green-100 text-green-700'
      case 'balance':
      case 'pending': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />

      <header className="bg-white shadow-sm px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/bales')}
            className="p-2 hover:bg-gray-100 rounded-lg min-h- min-w- flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{bale.bale_name}</h2>
            <p className="text-sm text-gray-500">{bale.bale_type} • {bale.weight_kg}kg</p>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 w-full">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Bale Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Package size={20} className="text-blue-600" />
                <span className="text-sm text-gray-600">Items Sold</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalSold} / {bale.total_items_estimated}</div>
              <div className="text-xs text-gray-500 mt-1">{remainingItems} remaining</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign size={20} className="text-green-600" />
                <span className="text-sm text-gray-600">Revenue</span>
              </div>
              <div className="text-2xl font-bold text-green-600">KES {totalRevenue.toLocaleString()}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={20} className={profit >= 0? 'text-green-600' : 'text-red-600'} />
                <span className="text-sm text-gray-600">Profit</span>
              </div>
              <div className={`text-2xl font-bold ${profit >= 0? 'text-green-600' : 'text-red-600'}`}>
                KES {profit.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">{profitMargin}% margin</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-2">Cost Price</div>
              <div className="text-2xl font-bold text-gray-900">KES {Number(bale.cost_price || 0).toLocaleString()}</div>
              <div className="text-xs mt-1">
                <span className={`px-2 py-0.5 rounded-full ${getStatusColor(bale.status)}`}>{bale.status}</span>
              </div>
            </div>
          </div>

          {/* Items Sold */}
          <div className="bg-white rounded-xl shadow-sm border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Items Sold from this Bale</h3>
            </div>

            {soldItems.length === 0? (
              <div className="p-12 text-center text-gray-500">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="font-medium">No items sold yet</p>
                <p className="text-sm mt-1">Items sold from POS will appear here</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="grid gap-3 p-4 sm:hidden">
                  {soldItems.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900">{item.item_description}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {item.sales.customers.name} • {item.sales.customers.phone}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Price: KES {Number(item.original_price || 0).toLocaleString()}</span>
                        <span className="font-semibold text-green-600">Paid: KES {Number(item.paid_amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(item.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border-b border-gray-200 px-4 py-3 text-left text-gray-900 font-semibold">Date</th>
                        <th className="border-b border-gray-200 px-4 py-3 text-left text-gray-900 font-semibold">Item</th>
                        <th className="border-b border-gray-200 px-4 py-3 text-left text-gray-900 font-semibold">Customer</th>
                        <th className="border-b border-gray-200 px-4 py-3 text-right text-gray-900 font-semibold">Price</th>
                        <th className="border-b border-gray-200 px-4 py-3 text-right text-gray-900 font-semibold">Paid</th>
                        <th className="border-b border-gray-200 px-4 py-3 text-left text-gray-900 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soldItems.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-900">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 font-medium text-gray-900">
                            {item.item_description}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                            {item.sales.customers.name}<br/>
                            <span className="text-xs text-gray-500">{item.sales.customers.phone}</span>
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-900">
                            KES {Number(item.original_price || 0).toLocaleString()}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-right font-semibold text-green-600">
                            KES {Number(item.paid_amount || 0).toLocaleString()}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}