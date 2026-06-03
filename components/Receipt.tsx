'use client'
import { useRef } from 'react'
import { Printer } from 'lucide-react'

export default function Receipt({ sale, shopSettings, onClose }: any) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = receiptRef.current?.innerHTML
    const win = window.open('', '', 'height=600,width=400')
    win?.document.write('<html><head><title>Receipt</title>')
    win?.document.write('<style>body{font-family:monospace;font-size:12px;padding:10px}.center{text-align:center}.bold{font-weight:bold}.row{display:flex;justify-content:space-between}</style>')
    win?.document.write('</head><body>')
    win?.document.write(content || '')
    win?.document.write('</body></html>')
    win?.document.close()
    win?.print()
  }

  const items = sale?.items || []
  const subtotal = (sale?.total_amount || 0) + (sale?.discount || 0) - (sale?.delivery_fee || 0)

  return (
    <div>
      <div ref={receiptRef} className="bg-white p-4 max-w-sm mx-auto border">
        <div className="center">
          <h2 className="bold">{shopSettings?.shop_name || 'COURAGE KIDS SHOP'}</h2>
          <p className="text-xs">Tel: {shopSettings?.shop_phone || '0707140205'}</p>
          <p className="text-xs">Email: {shopSettings?.shop_email || ''}</p>
          <p className="text-xs">M-Pesa: {shopSettings?.paybill} | Acc: {shopSettings?.acc_number}</p>
          <p className="text-xs border-b pb-2">--- CUSTOMER COPY ---</p>
        </div>

        <p className="text-xs mt-2">Invoice: {sale?.invoice_no || 'N/A'}</p>
        <p className="text-xs">Date: {sale?.created_at? new Date(sale.created_at).toLocaleString('en-KE') : new Date().toLocaleString('en-KE')}</p>
        <p className="text-xs border-b pb-2">Payment: {(sale?.payment_method || 'cash').toUpperCase()}</p>

        {/* Customer delivery details */}
        <div className="mt-2 text-xs space-y-0.5">
          <p><span className="bold">Customer:</span> {sale?.customer_name || '-'}</p>
          <p><span className="bold">Phone:</span> {sale?.customer_phone || '-'}</p>
          {sale?.whatsapp_name && <p><span className="bold">WhatsApp:</span> {sale.whatsapp_name}</p>}
          {sale?.tiktok_name && <p><span className="bold">TikTok:</span> {sale.tiktok_name}</p>}
          {sale?.delivery_location && <p><span className="bold">Location:</span> {sale.delivery_location}</p>}
          {sale?.gari && <p><span className="bold">Gari/Matatu:</span> {sale.gari}</p>}
        </div>

        <div className="border-t mt-2 pt-2 text-xs">
          {items.length === 0? (
            <p>No items</p>
          ) : (
            items.map((item: any, i: number) => (
              <div key={i} className="row">
                <span>{item.name} x{item.qty}</span>
                <span>Ksh {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>

        <div className="border-t mt-2 pt-2 text-xs space-y-0.5">
          <div className="row"><span>Subtotal:</span><span>Ksh {subtotal.toLocaleString()}</span></div>
          {(sale?.discount || 0) > 0 && <div className="row"><span>Discount:</span><span>-Ksh {(sale.discount).toLocaleString()}</span></div>}
          <div className="row"><span>Delivery Fee:</span><span>Ksh {(sale?.delivery_fee || 0).toLocaleString()}</span></div>
          <div className="row bold text-base border-t mt-1 pt-1"><span>TOTAL:</span><span>Ksh {(sale?.total_amount || 0).toLocaleString()}</span></div>
        </div>

        <p className="center text-xs mt-4">Thank you for shopping with us!</p>
      </div>

      <div className="flex gap-2 mt-4 justify-center">
        <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2">
          <Printer size={18} /> Print Receipt
        </button>
        <button onClick={onClose} className="bg-gray-500 text-white px-6 py-2 rounded-lg">New Sale</button>
      </div>
    </div>
  )
}