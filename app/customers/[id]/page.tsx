'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Save, Users, Trash2, MessageCircle } from 'lucide-react'
import Navbar from '@/components/navbar'

export default function EditCustomerPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    email: '',
    whatsapp_name: '',
    tiktok_name: '',
    delivery_location: '',
    address: '',
    customer_type: 'regular',
    notes: '',
    loyalty_points: 0,
    total_spent: 0,
    total_purchases: 0
  })

  useEffect(() => {
    fetchCustomer()
  }, [customerId])

  const fetchCustomer = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError ||!user) {
      router.push('/pos')
      return
    }

    const { data, error } = await supabase
     .from('customers')
     .select('*')
     .eq('id', customerId)
     .eq('user_id', user.id)
     .single()

    if (error ||!data) {
      alert('Customer not found')
      router.push('/customers')
      return
    }

    setForm({
      customer_name: data.customer_name || '',
      customer_phone: data.customer_phone || '',
      email: data.email || '',
      whatsapp_name: data.whatsapp_name || '',
      tiktok_name: data.tiktok_name || '',
      delivery_location: data.delivery_location || '',
      address: data.address || '',
      customer_type: data.customer_type || 'regular',
      notes: data.notes || '',
      loyalty_points: data.loyalty_points || 0,
      total_spent: data.total_spent || 0,
      total_purchases: data.total_purchases || 0
    })
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({...form, [e.target.name]: e.target.value})
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError ||!user) return

    const { error } = await supabase
     .from('customers')
     .update({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        email: form.email || null,
        whatsapp_name: form.whatsapp_name || null,
        tiktok_name: form.tiktok_name || null,
        delivery_location: form.delivery_location || null,
        address: form.address || null,
        customer_type: form.customer_type,
        notes: form.notes || null
      })
     .eq('id', customerId)
     .eq('user_id', user.id)

    setSaving(false)
    if (error) {
      alert('Error: ' + error.message)
      return
    }

    alert('Customer updated!')
    router.push('/customers')
  }

  const handleDelete = async () => {
    if (!confirm('Delete this customer? This cannot be undone.')) return

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError ||!user) return

    const { error } = await supabase
     .from('customers')
     .delete()
     .eq('id', customerId)
     .eq('user_id', user.id)

    if (error) {
      alert('Error: ' + error.message)
      return
    }

    alert('Customer deleted')
    router.push('/customers')
  }

  const openWhatsApp = () => {
    const cleanPhone = form.customer_phone.replace(/\D/g, '').slice(-9)
    window.open(`https://wa.me/254${cleanPhone}`, '_blank')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Navbar />
      <p className="text-gray-500">Loading customer...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} />
              Back
            </button>
            <h2 className="text-2xl font-bold text-gray-800">Edit Customer</h2>
          </div>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow p-8">
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Purchases</p>
              <p className="text-xl font-bold">{form.total_purchases}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Spent</p>
              <p className="text-xl font-bold text-green-600">Ksh {Number(form.total_spent).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Loyalty Points</p>
              <p className="text-xl font-bold text-yellow-600">{form.loyalty_points}</p>
            </div>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  name="customer_phone"
                  value={form.customer_phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp Name</label>
                <input
                  name="whatsapp_name"
                  value={form.whatsapp_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">TikTok Name</label>
                <input
                  name="tiktok_name"
                  value={form.tiktok_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Customer Type</label>
                <select
                  name="customer_type"
                  value={form.customer_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="regular">Regular</option>
                  <option value="vip">VIP Customer</option>
                  <option value="wholesale">Wholesale</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Address/Area</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Delivery Location</label>
              <textarea
                name="delivery_location"
                value={form.delivery_location}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-4 mb-6">
              <button
                type="button"
                onClick={openWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                <MessageCircle size={16} />
                Open WhatsApp
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/customers')}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2">
                <Save size={18} />
                {saving? 'Saving...' : 'Update Customer'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}