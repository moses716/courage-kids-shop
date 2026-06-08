'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Save, Phone, User, MessageCircle, MapPin, Star, StickyNote } from 'lucide-react'
import Navbar from '@/components/navbar'

export default function NewCustomerPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    whatsapp_name: '',
    tiktok_name: '',
    delivery_location: '',
    address: '',
    customer_type: 'regular',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      router.push('/pos')
      return
    }

    if (!form.name.trim() || !form.phone.trim()) {
      alert('Customer name and phone are required')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('customers').insert([{
      user_id: user.id,
      name: form.name.trim(),
      phone: form.phone.trim(),
      whatsapp_name: form.whatsapp_name || null,
      tiktok_name: form.tiktok_name || null,
      delivery_location: form.delivery_location || null,
      address: form.address || null,
      customer_type: form.customer_type,
      notes: form.notes || null,
      total_spent: 0,
      total_purchases: 0,
      loyalty_points: 0,
      is_active: true
    }])

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }

    alert('Customer added to COURAGE KIDS SHOP!')
    router.push('/customers')
  }

  const inputClass = "w-full px-3 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base min-h-12 text-gray-900 bg-white placeholder:text-gray-500"
  const labelClass = "text-sm font-medium mb-2 flex items-center gap-2 text-gray-900"

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />
      <header className="bg-white shadow-sm px-4 sm:px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/customers')} className="p-2 hover:bg-gray-100 rounded-lg min-h-12 min-w-12 flex items-center justify-center">
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add Customer - COURAGE KIDS SHOP</h2>
        </div>
      </header>

      <main className="p-4 sm:p-6 w-full max-w-screen">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
            
            <div>
              <label className={labelClass}>
                <User size={16} /> Customer Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className={inputClass}
                placeholder="e.g. Mary Wanjiku"
                required
              />
            </div>

            <div>
              <label className={labelClass}>
                <Phone size={16} /> Phone Number *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                className={inputClass}
                placeholder="07XX XXX"
                required
              />
            </div>

            <div>
              <label className={labelClass}>
                <MessageCircle size={16} /> WhatsApp Name
              </label>
              <input
                type="text"
                value={form.whatsapp_name}
                onChange={(e) => setForm({...form, whatsapp_name: e.target.value})}
                className={inputClass}
                placeholder="Name on WhatsApp"
              />
            </div>

            <div>
              <label className={labelClass}>TikTok Name</label>
              <input
                type="text"
                value={form.tiktok_name}
                onChange={(e) => setForm({...form, tiktok_name: e.target.value})}
                className={inputClass}
                placeholder="@tiktok_username"
              />
            </div>

            <div>
              <label className={labelClass}>
                <MapPin size={16} /> Address/Area
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
                className={inputClass}
                placeholder="e.g. Eldoret Town"
              />
            </div>

            <div>
              <label className={labelClass}>
                <MapPin size={16} /> Delivery Location
              </label>
              <textarea
                value={form.delivery_location}
                onChange={(e) => setForm({...form, delivery_location: e.target.value})}
                className={inputClass}
                rows={2}
                placeholder="Detailed delivery instructions"
              />
            </div>

            <div>
              <label className={labelClass}>
                <Star size={16} /> Customer Type
              </label>
              <select
                value={form.customer_type}
                onChange={(e) => setForm({...form, customer_type: e.target.value})}
                className={inputClass}
              >
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                <StickyNote size={16} /> Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({...form, notes: e.target.value})}
                className={inputClass}
                rows={3}
                placeholder="Any special notes..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/customers')}
                className="flex-1 py-3 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-900 min-h-12 text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 min-h-12 text-base"
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}