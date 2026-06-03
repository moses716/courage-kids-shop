'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

export default function AddBalePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: '',
    grade: '',
    origin: '',
    weight_kg: '',
    cost_price: '',
    selling_price: '',
    qty_in_stock: '',
    low_stock_threshold: '10'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({...form, [e.target.name]: e.target.value})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      router.push('/pos')
      return
    }

    const { error } = await supabase.from('bales').insert({
      user_id: user.id,
      sku: form.sku || null,
      name: form.name,
      category: form.category || null,
      grade: form.grade || null,
      origin: form.origin || null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      qty_in_stock: Number(form.qty_in_stock),
      low_stock_threshold: Number(form.low_stock_threshold)
    })

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }

    alert('Bale added successfully!')
    router.push('/bales')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/bales" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
            Back to Bales
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Add New Bale</h2>
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8">
          <div className="flex items-center gap-3 mb-6">
            <Package size={24} className="text-blue-600" />
            <h3 className="text-xl font-bold">Bale Details</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">SKU / Bale ID *</label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. BALE-KIDS-001"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bale Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Kids Mixed Cotton"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Kids Wear"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Grade</label>
              <select
                name="grade"
                value={form.grade}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Grade</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Origin</label>
              <input
                name="origin"
                value={form.origin}
                onChange={handleChange}
                placeholder="e.g. UK, USA"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Weight (KG)</label>
              <input
                name="weight_kg"
                type="number"
                step="0.1"
                value={form.weight_kg}
                onChange={handleChange}
                placeholder="45"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity in Stock *</label>
              <input
                name="qty_in_stock"
                type="number"
                value={form.qty_in_stock}
                onChange={handleChange}
                required
                min="0"
                placeholder="100"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Cost Price Ksh *</label>
              <input
                name="cost_price"
                type="number"
                value={form.cost_price}
                onChange={handleChange}
                required
                min="0"
                placeholder="15000"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Selling Price Ksh *</label>
              <input
                name="selling_price"
                type="number"
                value={form.selling_price}
                onChange={handleChange}
                required
                min="0"
                placeholder="200"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Low Stock Alert At</label>
              <input
                name="low_stock_threshold"
                type="number"
                value={form.low_stock_threshold}
                onChange={handleChange}
                min="0"
                placeholder="10"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Link 
              href="/bales"
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 transition"
            >
              {loading ? 'Saving...' : 'Save Bale'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}