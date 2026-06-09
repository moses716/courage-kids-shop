'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type SaleItem = {
  id: string
  created_at: string
  total_amount: number
  paid_amount: number
  balance: number
  payment_method: string
  customers: { id: string, name: string, phone: string }
  sales_items: {
    id: string
    item_description: string
    bale_source: string
    original_price: number
    paid_amount: number
    status: string
  }[]
}

type FlatItem = {
  saleId: string
  saleCreatedAt: string
  customerId: string
  customerName: string
  customerPhone: string
  totalAmount: number
  paidAmount: number
  balance: number
  paymentMethod: string
  itemId: string
  itemDescription: string
  baleSource: string
  originalPrice: number
  itemPaidAmount: number
  itemStatus: string
}

export default function MySalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<FlatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const { data } = await supabase.auth.getUser()
      const user = data.user

      if (!user) {
        router.push('/login')
        return
      }

      const { data: salesData, error } = await supabase
       .from('sales')
       .select(`
          id,
          created_at,
          total_amount,
          paid_amount,
          balance,
          payment_method,
          customers (id, name, phone),
          sales_items (id, item_description, bale_source, original_price, paid_amount, status)
        `)
       .eq('user_id', user.id)
       .order('created_at', { ascending: false })

      if (error) throw error

      const flatData: FlatItem[] = []
      salesData?.forEach((sale: SaleItem) => {
        sale.sales_items?.forEach((item) => {
          flatData.push({
            saleId: sale.id,
            saleCreatedAt: sale.created_at,
            customerId: sale.customers.id,
            customerName: sale.customers.name,
            customerPhone: sale.customers.phone,
            totalAmount: sale.total_amount,
            paidAmount: sale.paid_amount,
            balance: sale.balance,
            paymentMethod: sale.payment_method,
            itemId: item.id,
            itemDescription: item.item_description,
            baleSource: item.bale_source,
            originalPrice: item.original_price,
            itemPaidAmount: item.paid_amount,
            itemStatus: item.status
          })
        })
      })

      setSales(flatData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6 min-h-screen bg-gray-50 text-gray-900">Loading sales...</div>
  if (error) return <div className="p-6 min-h-screen bg-gray-50 text-red-600">Error: {error}</div>

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="p-4 sm:p-6 w-full max-w-screen">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">My Sales</h1>

        {sales.length === 0? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No sales yet. Go to POS to make first sale.</p>
            <button
              onClick={() => router.push('/pos')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-12 text-base"
            >
              Go to POS
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="min-w-lg w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Date</th>
                  <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Customer</th>
                  <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Item</th>
                  <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Bale</th>
                  <th className="border-gray-200 border-b px-4 py-3 text-right text-gray-900 font-semibold">Price</th>
                  <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(item => (
                  <tr key={item.itemId} className="hover:bg-gray-50">
                    <td className="border-gray-200 border-b px-4 py-3 text-gray-900">{new Date(item.saleCreatedAt).toLocaleDateString()}</td>
                    <td className="border-gray-200 border-b px-4 py-3 text-gray-900">{item.customerName}</td>
                    <td className="border-gray-200 border-b px-4 py-3 text-gray-900">{item.itemDescription}</td>
                    <td className="border-gray-200 border-b px-4 py-3 text-gray-700">{item.baleSource || '-'}</td>
                    <td className="border-gray-200 border-b px-4 py-3 text-right font-semibold text-gray-900">KES {item.originalPrice.toLocaleString()}</td>
                    <td className="border-gray-200 border-b px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.itemStatus === 'Paid' || item.itemStatus === 'Cleared'
                         ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.itemStatus}
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
  )
}