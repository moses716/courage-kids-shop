'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Navbar from '@/components/navbar'

type Bale = {
  id: string
  bale_name: string
  cost_price: number
  total_items: number
  status: string
}

export default function EditBalePage() {
  const router = useRouter()
  const params = useParams()
  const baleId = params.id as string

  const [bale, setBale] = useState<Bale | null>(null)
  const [baleName, setBaleName] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [totalItems, setTotalItems] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (baleId) {
      fetchBale()
    }
  }, [baleId])

  const fetchBale = async () => {
    const { data: { user } = {} } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
  .from('bales')
  .select('*')
  .eq('id', baleId)
  .eq('user_id', user.id)
  .single()

    if (error) {
      alert('Bale not found')
      router.push('/bales')
      return
    }

    setBale(data)
    setBaleName(data.bale_name)
    setCostPrice(String(data.cost_price))
    setTotalItems(String(data.total_items))
    setLoading(false)
  }

  const handleUpdate = async () => {
    if (!baleName.trim()) return alert('Enter bale name')
    if (!costPrice || Number(costPrice) <= 0) return alert('Enter valid cost price')
    if (!totalItems || Number(totalItems) <= 0) return alert('Enter valid total items')

    setSaving(true)

    const { data: { user } = {} } = await supabase.auth.getUser()
    if (!user) {
      alert('Not logged in')
      setSaving(false)
      return
    }

    const { error } = await supabase
  .from('bales')
  .update({
        bale_name: baleName.trim(),
        cost_price: Number(costPrice),
        total_items: Number(totalItems)
      })
  .eq('id', baleId)
  .eq('user_id', user.id)

    if (error) {
      alert('Error updating bale: ' + error.message)
      setSaving(false)
      return
    }

    alert('Bale updated successfully!')
    router.push('/bales')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 text-gray-900">Loading bale...</div>
    </div>
  )

  const inputClass = "w-full bg-white p-3 rounded border-gray-300 text-base min-h-12 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"

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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Bale</h2>
        </div>
      </header>

      <main className="p-4 sm:p-6 w-full max-w-screen">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bale Name
                </label>
                <input
                  type="text"
                  value={baleName}
                  onChange={e => setBaleName(e.target.value)}
                  placeholder="e.g. Kids Dresses Bale #12"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price (KES)
                </label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  placeholder="15000"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Items in Bale
                </label>
                <input
                  type="number"
                  value={totalItems}
                  onChange={e => setTotalItems(e.target.value)}
                  placeholder="200"
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is used to track items sold vs remaining
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => router.push('/bales')}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium min-h-12 text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium min-h-12 text-base disabled:opacity-50"
                >
                  <Save size={20} />
                  {saving? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}