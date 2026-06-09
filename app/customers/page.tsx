'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Customer = {
  id: string
  name: string
  phone: string
  tiktok: string
  matatu_gani: string
  number_plate: string
  address: string
  created_at: string
  user_id: string
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
     .from('customers')
     .select('*')
     .eq('user_id', userData.user.id)
     .order('created_at', { ascending: false })

    if (!error) setCustomers(data || [])
    setLoading(false)
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.tiktok?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="min-h-screen bg-gray-50 p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <button
            onClick={() => router.push('/customers/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-12"
          >
            + Add Customer
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">VIP Customers</p>
            <p className="text-3xl font-bold text-orange-600">0</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-green-600">KES 0</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4 mb-6">
          <input
            type="text"
            placeholder="Search name, phone, TikTok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Customer List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">No customers found</p>
            <button
              onClick={() => router.push('/customers/new')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add First Customer
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TikTok</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matatu</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plate</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">{c.name}</td>
                    <td className="px-6 py-4 text-gray-700">{c.phone}</td>
                    <td className="px-6 py-4 text-gray-700">{c.tiktok || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{c.matatu_gani || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{c.number_plate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}