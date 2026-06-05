'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

type Customer = { id: string, name: string, phone: string }
type Bale = { id: string, bale_name: string }
type ItemRow = {
  item_description: string
  bale_source: string
  bale_id: string
  original_price: number
  paid_amount: number
  status: string
}

export default function PiecePOS() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [bales, setBales] = useState<Bale[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [custSearch, setCustSearch] = useState('')
  const [showCustModal, setShowCustModal] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')

  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [cashAmount, setCashAmount] = useState(0)
  const [otherAmount, setOtherAmount] = useState(0)

  const [items, setItems] = useState<ItemRow[]>([{
    item_description: '',
    bale_source: '',
    bale_id: '',
    original_price: 0,
    paid_amount: 0,
    status: 'Paid'
  }])
  const [sessionId, setSessionId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => { loadSession() }, [])
  useEffect(() => { searchCustomers() }, [custSearch])
  useEffect(() => { loadBales() }, [])

  const loadSession = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error ||!user) {
      router.push('/login')
      return
    }

    const { data: session } = await supabase
     .from('pos_sessions')
     .select('id')
     .eq('user_id', user.id)
     .eq('status', 'open')
     .maybeSingle()

    setSessionId(session?.id || '')
  }

  const loadBales = async () => {
    const { data } = await supabase
     .from('bales')
     .select('id, bale_name')
     .eq('status', 'Open')
     .order('created_at', { ascending: false })
    setBales(data || [])
  }

  const searchCustomers = async () => {
    if (custSearch.length < 2) {
      setCustomers([])
      return
    }
    const { data } = await supabase
     .from('customers')
     .select('*')
     .or(`name.ilike.%${custSearch}%,phone.ilike.%${custSearch}%`)
     .limit(5)
    setCustomers(data || [])
  }

  const createCustomer = async () => {
    if (!newCustName.trim()) return alert('Enter customer name')
    setLoading(true)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError ||!user) {
      alert('Not logged in')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
     .from('customers')
     .insert({
        user_id: user.id,
        name: newCustName.trim(),
        phone: newCustPhone.trim()
      })
     .select()
     .single()

    if (error) {
      alert('Error creating customer: ' + error.message)
      setLoading(false)
      return
    }
    setSelectedCustomer(data)
    setShowCustModal(false)
    setNewCustName('')
    setNewCustPhone('')
    setCustSearch('')
    setLoading(false)
  }

  const addItemRow = () => {
    setItems([...items, {
      item_description: '',
      bale_source: items[0]?.bale_source || '',
      bale_id: items[0]?.bale_id || '',
      original_price: 0,
      paid_amount: 0,
      status: 'Paid'
    }])
  }

  const updateItem = (index: number, field: keyof ItemRow, value: any) => {
    const newItems = [...items]
    newItems[index] = {...newItems[index], [field]: value }

    if (field === 'paid_amount' || field === 'original_price') {
      const paid = Number(newItems[index].paid_amount) || 0
      const price = Number(newItems[index].original_price) || 0
      if (paid >= price && price > 0) newItems[index].status = 'Paid'
      else if (paid > 0) newItems[index].status = 'Balance'
      else newItems[index].status = 'Deposit'
    }

    if (field === 'bale_id') {
      const bale = bales.find(b => b.id === value)
      newItems[index].bale_source = bale?.bale_name || ''
    }

    setItems(newItems)
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i!== index))
  }

  const totalAmount = items.reduce((s: number, i: ItemRow) => s + (Number(i.original_price) || 0), 0)
  const basePaid = items.reduce((s: number, i: ItemRow) => s + (Number(i.paid_amount) || 0), 0)

  const totalPaid = paymentMethod === 'Split'? cashAmount + otherAmount :
    paymentMethod === 'Balance'? totalAmount :
      basePaid
  const totalBalance = totalAmount - totalPaid

  const handlePay = async () => {
    if (!selectedCustomer) return alert('Select customer first')
    if (items.some(i =>!i.item_description.trim())) return alert('Fill all item descriptions')
    if (totalAmount <= 0) return alert('Enter at least 1 item with price')
    if (paymentMethod === 'Split' && totalPaid!== totalAmount) return alert('Split amounts must equal total')

    setLoading(true)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError ||!user) {
      alert('Not logged in')
      setLoading(false)
      return
    }

   console.log('Session ID being sent:', sessionId, 'Type:', typeof sessionId)

    const { data: sale, error } = await supabase
     .from('sales')
     .insert({
        user_id: user.id,
        customer_id: selectedCustomer.id,
        session_id: null,
        total_amount: totalAmount,
        paid_amount: totalPaid,
        balance: totalBalance,
        payment_method: paymentMethod,
        status: 'completed'
      })
     .select()
     .single()

    if (error) {
      alert('Sale failed: ' + error.message)
      console.error('Sale error details:', error)
      setLoading(false)
      return
    }

    const { error: itemsError } = await supabase.from('sales_items').insert(
      items.map(i => ({
        sale_id: sale.id,
        item_description: i.item_description.trim(),
        bale_source: i.bale_source.trim(),
        bale_id: i.bale_id || null,
        original_price: Number(i.original_price) || 0,
        paid_amount: Number(i.paid_amount) || 0,
        status: i.status
      }))
    )

    if (itemsError) {
      alert('Error saving items: ' + itemsError.message)
      setLoading(false)
      return
    }

    printReceipt(sale.id, selectedCustomer, items, totalAmount, totalPaid, totalBalance, paymentMethod)

    setItems([{ item_description: '', bale_source: '', bale_id: '', original_price: 0, paid_amount: 0, status: 'Paid' }])
    setSelectedCustomer(null)
    setCustSearch('')
    setPaymentMethod('Cash')
    setCashAmount(0)
    setOtherAmount(0)
    setLoading(false)
  }

  const printReceipt = (saleId: string, cust: Customer, items: ItemRow[], total: number, paid: number, balance: number, payMethod: string) => {
    const itemsText = items.map(i =>
      `• ${i.item_description} - KES ${i.paid_amount}${i.status === 'Balance'? ` Bal ${i.original_price - i.paid_amount}` : ''}`
    ).join('\n')

    const message = `COURAGE BALE SHOP
Invoice: ${saleId.slice(0, 8).toUpperCase()}
Date: ${new Date().toLocaleString('en-KE')}

Customer: ${cust.name}
${cust.phone || ''}

${itemsText}

TOTAL: KES ${total}
PAID: KES ${paid}
Payment: ${payMethod}
${balance > 0? `BALANCE: KES ${balance}` : 'Status: Cleared'}

Thank you! Karibu tena 🙏`

    const html = `
      <html>
        <head>
          <style>
            body{font-family:monospace;font-size:12px;width:80mm;padding:10px;margin:0}
           .c{text-align:center}.b{font-weight:bold}.r{display:flex;justify-content:space-between}
            hr{border:none;border-top:1px dashed #000;margin:5px 0}
          </style>
        </head>
        <body>
          <div class="c b">COURAGE BALE SHOP</div>
          <div class="c">Mombasa, Kenya</div>
          <hr>
          <div>Invoice: ${saleId.slice(0, 8).toUpperCase()}</div>
          <div>Customer: ${cust.name}</div>
          ${cust.phone? `<div>Phone: ${cust.phone}</div>` : ''}
          <div>Date: ${new Date().toLocaleString('en-KE')}</div>
          <hr>
          ${items.map(i => `
            <div class="b">${i.item_description}</div>
            ${i.bale_source? `<div style="font-size:10px">Bale: ${i.bale_source}</div>` : ''}
            <div class="r"><span>Price: ${i.original_price}</span><span>Paid: ${i.paid_amount}</span></div>
            <div class="r" style="color:${i.status === 'Paid' || i.status === 'Cleared'? 'green' : 'orange'}">
              <span>Status:</span><span>${i.status}</span>
            </div>
          `).join('')}
          <hr>
          <div class="r b"><span>TOTAL:</span><span>KES ${total}</span></div>
          <div class="r"><span>PAID:</span><span>KES ${paid}</span></div>
          <div class="r"><span>Method:</span><span>${payMethod}</span></div>
          ${balance > 0? `<div class="r" style="color:orange"><span>BALANCE:</span><span>KES ${balance}</span></div>` : ''}
          <hr>
          <div class="c">Thank you! Karibu tena</div>
          <script>window.print(); setTimeout(()=>window.close(),100)</script>
        </body>
      </html>
    `

    const w = window.open('', '_blank', 'width=300,height=600')
    if (w) {
      w.document.write(html)
      w.document.close()
    }

    if (cust.phone) {
      const phone = cust.phone.replace(/\D/g, '')
      let formattedPhone = phone
      if (phone.startsWith('0')) formattedPhone = '254' + phone.slice(1)
      else if (phone.startsWith('254')) formattedPhone = phone
      else formattedPhone = '254' + phone
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
      setTimeout(() => window.open(whatsappUrl, '_blank'), 800)
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex-col">
      <div className="h-14 bg-gray-800 flex items-center justify-between px-4 border-b border-gray-700">
        <button onClick={() => router.push('/pos')} className="text-xl">✕</button>
        <span className="font-bold">New Sale</span>
        <button onClick={() => router.push('/sales/my-sales')} className="text-xl">📊</button>
      </div>

      <div className="p-4 border-b border-gray-700">
        {!selectedCustomer? (
          <div>
            <input
              placeholder="🔍 Search customer name or phone..."
              value={custSearch}
              onChange={e => setCustSearch(e.target.value)}
              className="w-full bg-gray-800 p-3 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            {customers.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className="w-full text-left bg-gray-800 p-3 rounded mb-1 hover:bg-gray-700"
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-gray-400 text-sm">{c.phone}</div>
              </button>
            ))}
            <button
              onClick={() => setShowCustModal(true)}
              className="w-full bg-purple-600 p-3 rounded font-bold hover:bg-purple-700"
            >
              + New Customer
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center bg-gray-800 p-3 rounded">
            <div>
              <div className="font-bold">{selectedCustomer.name}</div>
              <div className="text-sm text-gray-400">{selectedCustomer.phone}</div>
            </div>
            <button onClick={() => setSelectedCustomer(null)} className="text-red-400 text-sm">Change</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-gray-800 p-4 rounded-xl mb-3">
            <input
              placeholder="Item description - e.g. Sylvia Dress"
              value={item.item_description}
              onChange={e => updateItem(idx, 'item_description', e.target.value)}
              className="w-full bg-gray-700 p-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />

            <select
              value={item.bale_id}
              onChange={e => updateItem(idx, 'bale_id', e.target.value)}
              className="w-full bg-gray-700 p-2 rounded mb-2 text-sm"
            >
              <option value="">Select Bale Source</option>
              {bales.map(b => (
                <option key={b.id} value={b.id}>{b.bale_name}</option>
              ))}
            </select>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-gray-400 mb-1">Price</div>
                <input
                  type="number"
                  value={item.original_price || ''}
                  onChange={e => updateItem(idx, 'original_price', e.target.value)}
                  className="w-full bg-gray-700 p-2 rounded focus:outline-none"
                />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Paid</div>
                <input
                  type="number"
                  value={item.paid_amount || ''}
                  onChange={e => updateItem(idx, 'paid_amount', e.target.value)}
                  disabled={paymentMethod!== 'Cash'}
                  className="w-full bg-gray-700 p-2 rounded focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Status</div>
                <div className={`p-2 rounded text-center text-sm font-bold ${
                  item.status === 'Paid' || item.status === 'Cleared'
                   ? 'bg-green-900 text-green-300'
                    : 'bg-orange-900 text-orange-300'
                }`}>
                  {item.status}
                </div>
              </div>
            </div>
            {items.length > 1 && (
              <button onClick={() => removeItem(idx)} className="text-red-400 text-xs mt-2">
                Remove item
              </button>
            )}
          </div>
        ))}
        <button onClick={addItemRow} className="w-full border-2 border-dashed border-gray-600 p-3 rounded hover:border-purple-600">
          + Add Item
        </button>
      </div>

      {selectedCustomer && (
        <div className="bg-gray-800 p-4 border-t border-gray-700">
          <div className="flex justify-between mb-3 text-sm">
            <span>Items: {items.length}</span>
            <span>Total: KES {totalAmount.toLocaleString()}</span>
          </div>

          <div className="flex gap-2 mb-3">
            <button onClick={() => setPaymentMethod('Cash')} className={`flex-1 py-2 rounded text-sm ${paymentMethod === 'Cash'? 'bg-purple-600' : 'bg-gray-700'}`}>Cash</button>
            <button onClick={() => setPaymentMethod('Split')} className={`flex-1 py-2 rounded text-sm ${paymentMethod === 'Split'? 'bg-purple-600' : 'bg-gray-700'}`}>Split</button>
            <button onClick={() => setPaymentMethod('Balance')} className={`flex-1 py-2 rounded text-sm ${paymentMethod === 'Balance'? 'bg-orange-600' : 'bg-gray-700'}`}>Full Balance</button>
          </div>

          {paymentMethod === 'Split' && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs text-gray-400">Cash</label>
                <input type="number" value={cashAmount || ''} onChange={e => setCashAmount(Number(e.target.value))} className="w-full bg-gray-700 p-2 rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Other</label>
                <input type="number" value={otherAmount || ''} onChange={e => setOtherAmount(Number(e.target.value))} className="w-full bg-gray-700 p-2 rounded text-sm" />
              </div>
            </div>
          )}

          <div className="flex justify-between mb-3 font-bold">
            <span>Paid: KES {totalPaid.toLocaleString()}</span>
            <span className={totalBalance > 0? 'text-orange-400' : 'text-green-400'}>
              Balance: KES {totalBalance.toLocaleString()}
            </span>
          </div>

          <button onClick={handlePay} disabled={loading}
            className="w-full bg-purple-600 py-4 rounded-xl font-bold text-lg disabled:opacity-50">
            {loading? 'Processing...' : `Pay & Print KES ${totalPaid.toLocaleString()}`}
          </button>
        </div>
      )}

      {showCustModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-sm">
            <h3 className="font-bold mb-4 text-lg">New Customer</h3>
            <input placeholder="Name - Sylvia Akayo" value={newCustName} onChange={e => setNewCustName(e.target.value)} className="w-full bg-gray-700 p-3 rounded mb-2" />
            <input placeholder="Phone - 0719 149 848" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} className="w-full bg-gray-700 p-3 rounded mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowCustModal(false)} className="flex-1 bg-gray-700 py-3 rounded">Cancel</button>
              <button onClick={createCustomer} disabled={loading} className="flex-1 bg-purple-600 py-3 rounded font-bold disabled:opacity-50">{loading? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}