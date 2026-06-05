'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Session = {
  id: string
  opening_cash: number
  closing_cash: number | null
  opening_time: string
  closing_time: string | null
  status: string
}

export default function SessionPage() {
  const [openingCash, setOpeningCash] = useState('2000')
  const [openSession, setOpenSession] = useState<Session | null>(null)
  const [sessionSales, setSessionSales] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [actualCash, setActualCash] = useState('')
  const router = useRouter()

  useEffect(() => { checkSession() }, [])

  const checkSession = async () => {
    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      router.push('/login')
      return
    }

    const { data: session } = await supabase
     .from('cash_sessions')
     .select('*')
     .eq('cashier_id', user.data.user.id)
     .eq('status', 'open')
     .single()

    if (session) {
      setOpenSession(session)
      loadSessionSales(session.id)
    }
  }

  const loadSessionSales = async (sessionId: string) => {
    const { data } = await supabase
     .from('sales')
     .select('total_amount, paid_amount, balance, created_at')
     .eq('session_id', sessionId)
     .order('created_at', { ascending: false })

    setSessionSales(data || [])
  }

  const startSession = async () => {
    if (!openingCash || Number(openingCash) < 0) {
      alert('Enter valid opening cash')
      return
    }

    setLoading(true)
    const user = await supabase.auth.getUser()

    const { data, error } = await supabase
     .from('cash_sessions')
     .insert({
        cashier_id: user.data.user?.id,
        opening_cash: Number(openingCash)
      })
     .select()
     .single()

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }

    setOpenSession(data)
    setLoading(false)
    router.push('/sales/new')
  }

  const openCloseModal = () => {
    setActualCash('')
    setShowCloseModal(true)
  }

  const closeSession = async () => {
    const cashCounted = Number(actualCash)
    if (cashCounted < 0) return alert('Enter valid cash amount')

    setLoading(true)
    const user = await supabase.auth.getUser()

    const { error } = await supabase
     .from('cash_sessions')
     .update({
        closing_cash: cashCounted,
        closing_time: new Date().toISOString(),
        status: 'closed'
      })
     .eq('id', openSession!.id)

    if (error) {
      alert('Error closing session: ' + error.message)
      setLoading(false)
      return
    }

    alert(`Session closed successfully!\n\n${getSessionSummary()}`)
    setShowCloseModal(false)
    setOpenSession(null)
    setSessionSales([])
    setLoading(false)
    router.push('/sales')
  }

  // Calculate session totals
  const totalSales = sessionSales.reduce((s, sale) => s + sale.paid_amount, 0)
  const totalBalance = sessionSales.reduce((s, sale) => s + sale.balance, 0)
  const expectedCash = openSession? Number(openSession.opening_cash) + totalSales : 0
  const actualCashNum = Number(actualCash) || 0
  const difference = actualCashNum - expectedCash

  const getSessionSummary = () => {
    return `Opening Cash: KES ${openSession?.opening_cash}
Sales Made: KES ${totalSales.toLocaleString()}
Expected Cash: KES ${expectedCash.toLocaleString()}
Actual Cash: KES ${actualCashNum.toLocaleString()}
Difference: KES ${difference.toLocaleString()} ${difference === 0? '✓' : difference > 0? '(Over)' : '(Short)'}
Outstanding: KES ${totalBalance.toLocaleString()}`
  }

  if (!openSession) {
    // Odoo-style Session Start screen
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Courage Bale Shop</h1>
            <p className="text-gray-400">Mitumba Sales POS</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="text-sm text-gray-400 mb-1">
              Date: {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="text-sm text-gray-400 mb-4">Time: {new Date().toLocaleTimeString('en-KE')}</div>

            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">Opening Cash</label>
              <input
                type="number"
                value={openingCash}
                onChange={e => setOpeningCash(e.target.value)}
                className="w-full bg-gray-700 p-4 rounded text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="2000"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">Cash in drawer at start of shift</p>
            </div>

            <button
              onClick={startSession}
              disabled={loading}
              className="w-full bg-purple-600 py-4 rounded-xl font-bold text-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading? 'Starting...' : 'Start Bale Sale'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/sales/my-sales')}
              className="text-gray-400 text-sm"
            >
              View Sales Reports
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Session is open - Show session dashboard
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Active Session</h1>
          <p className="text-xs text-gray-400">
            Started: {new Date(openSession.opening_time).toLocaleTimeString('en-KE')}
          </p>
        </div>
        <button
          onClick={openCloseModal}
          className="bg-red-600 px-4 py-2 rounded-lg text-sm font-bold"
        >
          Close Register
        </button>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-800 p-4 rounded-xl">
          <div className="text-gray-400 text-xs">OPENING CASH</div>
          <div className="text-2xl font-bold mt-1">KES {openSession.opening_cash.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl">
          <div className="text-gray-400 text-xs">SALES MADE</div>
          <div className="text-2xl font-bold mt-1 text-green-400">KES {totalSales.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-blue-500/30">
          <div className="text-blue-400 text-xs">EXPECTED CASH</div>
          <div className="text-2xl font-bold mt-1 text-blue-400">KES {expectedCash.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border-orange-500/30">
          <div className="text-orange-400 text-xs">OUTSTANDING</div>
          <div className="text-2xl font-bold mt-1 text-orange-400">KES {totalBalance.toLocaleString()}</div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-gray-800 rounded-xl p-4 mb-4">
        <h3 className="font-bold mb-3">Recent Sales - {sessionSales.length} transactions</h3>
        {sessionSales.length === 0? (
          <p className="text-gray-500 text-center py-8">No sales yet. Start selling!</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sessionSales.slice(0, 10).map((sale, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                <div className="text-sm">
                  <div>{new Date(sale.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">KES {sale.paid_amount.toLocaleString()}</div>
                  {sale.balance > 0 && (
                    <div className="text-xs text-orange-400">Balance: KES {sale.balance.toLocaleString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push('/sales/new')}
          className="bg-purple-600 py-4 rounded-xl font-bold text-lg"
        >
          New Sale
        </button>
        <button
          onClick={() => router.push('/sales/my-sales')}
          className="bg-gray-700 py-4 rounded-xl font-bold text-lg"
        >
          My Sales
        </button>
      </div>

      {/* Close Session Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-sm">
            <h3 className="font-bold mb-4 text-lg">Close Register</h3>

            <div className="bg-gray-700 p-4 rounded-lg mb-4 text-sm">
              <div className="flex justify-between mb-2">
                <span>Opening Cash:</span>
                <span>KES {openSession.opening_cash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Sales Made:</span>
                <span className="text-green-400">+ KES {totalSales.toLocaleString()}</span>
              </div>
              <hr className="border-gray-600 my-2" />
              <div className="flex justify-between font-bold">
                <span>Expected Cash:</span>
                <span className="text-blue-400">KES {expectedCash.toLocaleString()}</span>
              </div>
            </div>

            <label className="text-sm text-gray-400 mb-2 block">Count actual cash in drawer:</label>
            <input
              type="number"
              value={actualCash}
              onChange={e => setActualCash(e.target.value)}
              className="w-full bg-gray-700 p-4 rounded text-2xl font-bold text-center mb-4 focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="0"
              autoFocus
            />

            {actualCash && (
              <div className={`p-3 rounded-lg mb-4 text-center font-bold ${
                difference === 0? 'bg-green-900 text-green-300' :
                difference > 0? 'bg-blue-900 text-blue-300' :
                'bg-red-900 text-red-300'
              }`}>
                Difference: KES {Math.abs(difference).toLocaleString()} {difference === 0? '✓ Balanced' : difference > 0? '(Over)' : '(Short)'}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 bg-gray-700 py-3 rounded font-bold"
              >
                Cancel
              </button>
              <button
                onClick={closeSession}
                disabled={loading || !actualCash}
                className="flex-1 bg-red-600 py-3 rounded font-bold disabled:opacity-50"
              >
                {loading? 'Closing...' : 'Confirm Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}