'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function NewBalePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    bale_name: '',
    bale_type: '',
    weight_kg: '',
    cost_price: '',
    total_items_estimated: '',
    date_received: new Date().toISOString().split('T')[0]
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error('You must be logged in')

      const { error: insertError } = await supabase
      .from('bales')
      .insert({
          user_id: user.id,
          bale_name: form.bale_name,
          bale_type: form.bale_type,
          weight_kg: form.weight_kg? parseFloat(form.weight_kg) : null,
          cost_price: parseFloat(form.cost_price),
          total_items_estimated: form.total_items_estimated? parseInt(form.total_items_estimated) : null,
          date_received: form.date_received,
          status: 'Open'
        })

      if (insertError) throw insertError

      setSuccess('Bale added successfully!')
      setForm({
        bale_name: '',
        bale_type: '',
        weight_kg: '',
        cost_price: '',
        total_items_estimated: '',
        date_received: new Date().toISOString().split('T')[0]
      })

      setTimeout(() => router.push('/bales'), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to save bale')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Bale</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Bale Name *</label>
          <input
            type="text"
            name="bale_name"
            value={form.bale_name}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="NEW BALE 29/5"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Bale Type *</label>
          <select
            name="bale_type"
            value={form.bale_type}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select type...</option>
            <option value="Kids Mix">Kids Mix</option>
            <option value="Ladies Dresses">Ladies Dresses</option>
            <option value="Men Shirts">Men Shirts</option>
            <option value="Jeans">Jeans</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Weight kg</label>
            <input
              type="number"
              name="weight_kg"
              value={form.weight_kg}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Cost Price KES *</label>
            <input
              type="number"
              name="cost_price"
              value={form.cost_price}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Est Items</label>
            <input
              type="number"
              name="total_items_estimated"
              value={form.total_items_estimated}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Date Received *</label>
            <input
              type="date"
              name="date_received"
              value={form.date_received}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium disabled:opacity-50"
        >
          {loading? 'Saving...' : 'Save Bale'}
        </button>
      </form>
    </div>
  )
}