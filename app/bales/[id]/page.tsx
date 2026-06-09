'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Package, DollarSign, TrendingUp } from 'lucide-react'
import Navbar from '@/components/navbar'

type Bale = {
  id: string
  bale_name: string
  cost_price: number
  total_items: number
  created_at: string
  status: string
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

  useEffect(() => {
    if (baleId) {
      fetchBaleDetails()
    }
  }, [baleId])

  const fetchBaleDetails = async () => {
    const { data: { user } = {} } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get bale info
    const { data: baleData } = await supabase
  .from('bales')
  .select('*')
  .eq('id', baleId)
  .eq('user_id', user.id)
  .single()

    setBale(baleData)

    // Get all items sold from this bale
    const { data: itemsData } = await supabase
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

    setSoldItems(itemsData || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 text-gray-900">Loading bale details...</div>
    </div>
  )

  if (!bale) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 text-gray-900">Bale not found</div>
    </div>
  )

  const totalRevenue = soldItems.reduce((sum, item) => sum + Number(item.paid_amount), 0)
  const totalSold = soldItems.length
  const remainingItems = bale.total_items - totalSold
  const profit = totalRevenue - Number(bale.cost_price)

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />

      <header className="bg-white shadow-sm px-4 sm:px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/bales')}
            className="p-2 hover:bg-gray-100 rounded-lg min-h-12 min-w-12 flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{bale.bale_name}</h2>
            <p className="text-sm text-gray-600">Bale Details</p>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 w-full max-w-screen">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Bale Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-3 mb-2">
                <Package size={20} className="text-blue-600" />
                <span className="text-sm text-gray-600">Items Sold</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalSold} / {bale.total_items}</div>
              <div className="text-xs text-gray-500 mt-1">{remainingItems} remaining</div>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign size={20} className="text-green-600" />
                <span className="text-sm text-gray-600">Revenue</span>
              </div>
              <div className="text-2xl font-bold text-green-600">KES {totalRevenue.toLocaleString()}</div>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={20} className="text-purple-600" />
                <span className="text-sm text-gray-600">Profit</span>
              </div>
              <div className={`text-2xl font-bold ${profit >= 0? 'text-green-600' : 'text-red-600'}`}>
                KES {profit.toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-sm text-gray-600 mb-2">Cost Price</div>
              <div className="text-2xl font-bold text-gray-900">KES {Number(bale.cost_price).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Status: {bale.status}</div>
            </div>
          </div>

          {/* Items Sold Table */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Items Sold from this Bale</h3>
            </div>

            {soldItems.length === 0? (
              <div className="p-12 text-center text-gray-500">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p>No items sold from this bale yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-lg w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Date</th>
                      <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Item</th>
                      <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Customer</th>
                      <th className="border-gray-200 border-b px-4 py-3 text-right text-gray-900 font-semibold">Price</th>
                      <th className="border-gray-200 border-b px-4 py-3 text-right text-gray-900 font-semibold">Paid</th>
                      <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border-gray-200 border-b px-4 py-3 text-gray-900">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="border-gray-200 border-b px-4 py-3 font-medium text-gray-900">
                          {item.item_description}
                        </td>
                        <td className="border-gray-200 border-b px-4 py-3 text-gray-700">
                          {item.sales.customers.name}
                        </td>
                        <td className="border-gray-200 border-b px-4 py-3 text-right text-gray-900">
                          KES {Number(item.original_price).toLocaleString()}
                        </td>
                        <td className="border-gray-200 border-b px-4 py-3 text-right font-semibold text-green-600">
                          KES {Number(item.paid_amount).toLocaleString()}
                        </td>
                        <td className="border-gray-200 border-b px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'Paid' || item.status === 'Cleared'
                           ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}