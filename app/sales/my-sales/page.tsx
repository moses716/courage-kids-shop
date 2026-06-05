'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

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

  if (loading) return <div className="p-6">Loading sales...</div>
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Sales</h1>
      
      {sales.length === 0 ? (
        <p>No sales yet. Go to POS to make first sale.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Customer</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Bale</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Price</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(item => (
                <tr key={item.itemId}>
                  <td className="border border-gray-300 px-4 py-2">{new Date(item.saleCreatedAt).toLocaleDateString()}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.customerName}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.itemDescription}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.baleSource}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">KES {item.originalPrice}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.itemStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}