'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Receipt from '@/components/Receipt'

type CartItem = {
  id: string
  name: string
  price: number
  qty: number
}

export default function NewSalePage() {
  const supabase = createClient()
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [whatsappName, setWhatsappName] = useState('')
  const [tiktokName, setTiktokName] = useState('')
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [gari, setGari] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [userId, setUserId] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [shopSettings, setShopSettings] = useState<any>(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data } = await supabase.auth.getUser()
    const user = data?.user
    if (!user) return
    setUserId(user.id)

    const { data: settings } = await supabase
   .from('settings')
   .select('*')
   .eq('user_id', user.id)
   .single()
    setShopSettings(settings)
    if (settings?.delivery_fee_default) setDeliveryFee(settings.delivery_fee_default)
  }

  useEffect(() => {
    if (customerPhone.length >= 10) {
      loadCustomer(customerPhone)
    }
  }, [customerPhone])

  const loadCustomer = async (phone: string) => {
    const { data } = await supabase
   .from('customers')
   .select('*')
   .eq('user_id', userId)
   .eq('phone', phone)
   .single()

    if (data) {
      setCustomerName(data.name || '')
      setWhatsappName(data.whatsapp_name || '')
      setTiktokName(data.tiktok_name || '')
      setDeliveryLocation(data.location || '')
      setGari(data.gari || '')
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const total = subtotal - discount + deliveryFee

  const handleCheckout = async () => {
    if (!customerPhone || cart.length === 0) {
      alert('Add customer phone and items')
      return
    }

    const invoiceNo = `CKS-${Date.now().toString().slice(-6)}`

    const { data: customer } = await supabase
   .from('customers')
   .upsert({
       user_id: userId,
       phone: customerPhone,
       name: customerName,
       whatsapp_name: whatsappName,
       tiktok_name: tiktokName,
       location: deliveryLocation,
       gari: gari
     }, { onConflict: 'phone' })
   .select()
   .single()

    const { data: sale, error } = await supabase
   .from('sales')
   .insert({
       user_id: userId,
       invoice_no: invoiceNo,
       customer_id: customer?.id,
       customer_name: customerName,
       customer_phone: customerPhone,
       whatsapp_name: whatsappName,
       tiktok_name: tiktokName,
       delivery_location: deliveryLocation,
       gari: gari,
       delivery_fee: deliveryFee,
       total_amount: total,
       discount: discount,
       payment_method: paymentMethod
     })
   .select()
   .single()

    if (error) {
      alert('Error: ' + error.message)
      return
    }

    // IMPORTANT: Attach cart items so Receipt can map them
    setLastSale({...sale, items: cart })
    setShowReceipt(true)

    setCart([])
    setCustomerPhone('')
    setCustomerName('')
    setWhatsappName('')
    setTiktokName('')
    setDeliveryLocation('')
    setGari('')
    setDiscount(0)
  }

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">New Sale</h1>

        {!showReceipt? (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="font-semibold text-lg">Customer Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="border rounded px-3 py-2"/>
              <input placeholder="Phone 0707140205" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="border rounded px-3 py-2"/>
              <input placeholder="WhatsApp Name - optional" value={whatsappName} onChange={e => setWhatsappName(e.target.value)} className="border rounded px-3 py-2"/>
              <input placeholder="TikTok Name - optional" value={tiktokName} onChange={e => setTiktokName(e.target.value)} className="border rounded px-3 py-2"/>
            </div>

            <h2 className="font-semibold text-lg mt-4">Delivery Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input placeholder="Delivery Location - Area/Building" value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} className="border rounded px-3 py-2"/>
              <input placeholder="Gari/Matatu to use e.g KQ23" value={gari} onChange={e => setGari(e.target.value)} className="border rounded px-3 py-2"/>
              <input type="number" placeholder="Delivery Fee Ksh" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} className="border rounded px-3 py-2"/>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="border rounded px-3 py-2">
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
              </select>
            </div>

            <input type="number" placeholder="Discount Ksh" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full border rounded px-3 py-2"/>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">Add items to cart here...</p>
              <p className="font-bold mt-2">Subtotal: Ksh {subtotal.toLocaleString()}</p>
              <p className="font-bold">Delivery: Ksh {deliveryFee.toLocaleString()}</p>
              <p className="font-bold text-xl">Total: Ksh {total.toLocaleString()}</p>
            </div>

            <button onClick={handleCheckout} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
              Complete Sale & Print Receipt
            </button>
          </div>
        ) : (
          <Receipt sale={lastSale} shopSettings={shopSettings} onClose={() => setShowReceipt(false)} />
        )}
      </div>
    </main>
  )
}