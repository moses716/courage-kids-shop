'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client' // FIXED: use same client as NewSalePage
import { Save } from 'lucide-react'

type Settings = {
  id: string
  shop_name: string
  paybill: string
  acc_number: string
}

export default function SettingsPage() {
  const supabase = createClient() // FIXED
  const [settings, setSettings] = useState<Settings | null>(null)
  const [shopName, setShopName] = useState('')
  const [paybill, setPaybill] = useState('')
  const [accNo, setAccNo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data } = await supabase.auth.getUser() // FIXED: get data first
    const user = data?.user // FIXED: access user safely
    if (!user) return

    const { data: settingsData } = await supabase
     .from('settings')
     .select('*')
     .eq('user_id', user.id)
     .single()

    if (settingsData) {
      setSettings(settingsData)
      setShopName(settingsData.shop_name)
      setPaybill(settingsData.paybill)
      setAccNo(settingsData.acc_number)
    } else {
      // Create default settings if none exist
      const { data: newSettings } = await supabase
       .from('settings')
       .insert({ user_id: user.id })
       .select()
       .single()
      
      if (newSettings) {
        setSettings(newSettings)
        setShopName(newSettings.shop_name)
        setPaybill(newSettings.paybill)
        setAccNo(newSettings.acc_number)
      }
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)

    const { error } = await supabase
     .from('settings')
     .update({
       shop_name: shopName,
       paybill: paybill,
       acc_number: accNo,
       updated_at: new Date().toISOString()
     })
     .eq('id', settings.id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Settings saved!')
      setSettings({ ...settings, shop_name: shopName, paybill, acc_number: accNo })
    }
    setSaving(false)
  }

  if (loading) return <div className="p-6">Loading settings...</div>

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">COURAGE KIDS SHOP - Settings</h1>
        
        <div className="bg-white rounded-xl shadow border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Business Info</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">Shop Name</label>
            <input 
              value={shopName} 
              onChange={e => setShopName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">M-Pesa Paybill</label>
              <input 
                value={paybill} 
                onChange={e => setPaybill(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <input 
                value={accNo} 
                onChange={e => setAccNo(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <p className="text-xs text-gray-500">These details appear on all receipts automatically</p>
        </div>
      </div>
    </main>
  )
}