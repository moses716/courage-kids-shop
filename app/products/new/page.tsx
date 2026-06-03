'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const supabase = createClient()
    const authResult = await supabase.auth.getUser()
    const user = authResult.data.user
    
    if (!user) {
      alert('Please login first')
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('products')
      .insert({
        name,
        sku: sku || null,
        price: Number(price),
        stock: Number(stock),
        user_id: user.id
      })

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
    } else {
      router.push('/products')
      router.refresh()
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/products" className="flex items-center gap-2 text-gray-600 hover:text-black mb-4">
        <ArrowLeft size={18}/> Back to Products
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Product Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Nike Air Max"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">SKU / Barcode</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Price Ksh *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Stock Qty *</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              min="0"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={18}/>
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </form>
    </div>
  )
}