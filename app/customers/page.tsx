'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Users, Plus, Search, Edit, Trash2, Phone, MessageCircle, Star, TrendingUp, MapPin } from 'lucide-react'
import Navbar from '@/components/navbar'

interface Customer {
  id: string
  name: string
  phone: string
  whatsapp_name: string | null
  tiktok_name: string | null
  delivery_location: string | null
  address: string | null
  customer_type: string
  notes: string | null
  loyalty_points: number
  last_visit: string
  created_at: string
  is_active: boolean
  total_spent: number
  total_purchases: number
}

export default function CustomersPage() {
  const supabase = createClient()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError ||!user) {
      router.push('/pos')
      return
    }

    // Fix 13: Join sales to calculate real totals
    const { data, error } = await supabase
     .from('customers')
     .select(`
        *,
        sales:sales(count, total_amount.sum())
      `)
     .eq('user_id', user.id)
     .eq('is_active', true)
     .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      const customersWithTotals = (data || []).map((c: any) => ({
       ...c,
        total_purchases: c.sales?.[0]?.count || 0,
        total_spent: Number(c.sales?.[0]?.sum || 0)
      }))
      setCustomers(customersWithTotals)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate ${name}? You can reactivate later.`)) {
      return
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError ||!user) {
      return
    }

    // Fix 6: Soft delete instead of hard delete
    const { error } = await supabase
     .from('customers')
     .update({ is_active: false })
     .eq('id', id)
     .eq('user_id', user.id)

    if (error) {
      alert('Error: ' + error.message)
      return
    }

    setCustomers(customers.filter(c => c.id!== id))
    alert('Customer deactivated')
  }

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-9)
    window.open(`https://wa.me/254${cleanPhone}`, '_blank')
  }

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.phone.includes(searchTerm) ||
                         c.whatsapp_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.tiktok_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterType === 'all' || c.customer_type === filterType

    return matchesSearch && matchesFilter
  })

  const getCustomerTypeBadge = (type: string) => {
    if (type === 'vip') return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center gap-1"><Star size={12} /> VIP</span>
    if (type === 'wholesale') return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full flex items-center gap-1"><TrendingUp size={12} /> Wholesale</span>
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">Regular</span>
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Navbar />
      <p className="text-gray-500">Loading customers...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />
      <header className="bg-white shadow-sm px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Customers - COURAGE KIDS SHOP</h2>
          <button
            onClick={() => router.push('/customers/new')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium min-h-12 text-base"
          >
            <Plus size={20} />
            Add Customer
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6 w-full max-w-screen">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow">
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              <p className="text-sm text-gray-600">VIP Customers</p>
              <p className="text-2xl font-bold text-yellow-600">{customers.filter(c => c.customer_type === 'vip').length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-green-600">Ksh {customers.reduce((sum, c) => sum + Number(c.total_spent), 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, phone, WhatsApp, TikTok..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base min-h-12 text-gray-900 bg-white"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base min-h-12 text-gray-900 bg-white"
              >
                <option value="all">All Types</option>
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>
          </div>

          {filteredCustomers.length === 0? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No customers found</p>
              <button
                onClick={() => router.push('/customers/new')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-12 text-base"
              >
                Add First Customer
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{customer.name}</h3>
                      {getCustomerTypeBadge(customer.customer_type)}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone size={14} />
                      <span>{customer.phone}</span>
                    </div>

                    {customer.whatsapp_name && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <MessageCircle size={14} />
                        <span className="truncate">WA: {customer.whatsapp_name}</span>
                      </div>
                    )}

                    {customer.tiktok_name && (
                      <div className="flex items-center gap-2 text-sm text-pink-700">
                        <span className="text-xs font-bold">TT</span>
                        <span className="truncate">{customer.tiktok_name}</span>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin size={14} />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-600">Purchases</p>
                        <p className="font-bold text-gray-900">{customer.total_purchases}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Spent</p>
                        <p className="font-bold text-green-600">Ksh {Number(customer.total_spent).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Points</p>
                        <p className="font-bold text-yellow-600">{customer.loyalty_points}</p>
                      </div>
                    </div>
                  </div>

                  {customer.customer_type === 'vip' && (
                    <div className="bg-linear-to-r from-yellow-50 to-orange-50 rounded-lg p-2 mb-3">
                      <p className="text-xs text-yellow-800 font-medium">⭐ VIP Customer - Priority Service</p>
                    </div>
                  )}

                  {customer.notes && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">Note: {customer.notes}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openWhatsApp(customer.phone)}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-1 min-h-12"
                    >
                      <MessageCircle size={16} />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-12"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id, customer.name)}
                      className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-12"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}