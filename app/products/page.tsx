'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'

type Product = {
  id: string
  name: string
  sku: string | null
  price: number
  stock: number
  user_id: string
  created_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    
    // Fixed: No nested destructuring to avoid TS errors
    const authResult = await supabase.auth.getUser()
    const user = authResult.data.user
    
    if (!user) {
      setLoading(false)
      return
    }
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading products:', error.message)
    }
    setProducts(data || [])
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-center">Loading products...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package size={28}/> Products
        </h1>
        <Link 
          href="/products/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18}/> Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border">
          <Package size={48} className="mx-auto text-gray-400 mb-4"/>
          <p className="text-gray-500 mb-4">No products yet</p>
          <Link href="/products/new" className="text-blue-600 font-semibold">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-lg truncate">{p.name}</h3>
              <p className="text-gray-500 text-sm">SKU: {p.sku || 'N/A'}</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xl font-bold text-green-600">Ksh {Number(p.price).toFixed(2)}</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${
                  p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  Stock: {p.stock}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}