'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function PosLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }
    
    if (data.user) {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">COURAGE KIDS SHOP</h1> {/* FIXED: Watoto POS → COURAGE KIDS SHOP */}
          <p className="text-gray-600 mt-2">Ingia kuendelea na mauzo</p>
        </div>

        <form onSubmit={handleSignIn} className="bg-white p-8 rounded-xl shadow-lg">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input 
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none" /* FIXED: added border */
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input 
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none" /* FIXED: added border */
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Inaingia...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  )
}