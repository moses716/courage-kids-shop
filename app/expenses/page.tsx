'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, DollarSign, Calendar } from 'lucide-react'
import Navbar from '@/components/navbar'

const supabase = createClient()

type Expense = {
  id: string
  description: string
  amount: number
  category: string
  expense_date: string
  created_at: string
}

const EXPENSE_CATEGORIES = [
  'Rent',
  'Transport',
  'Airtime',
  'Utilities',
  'Supplies',
  'Food',
  'Miscellaneous'
]

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Rent')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    const { data: { user } = {} } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
     .from('expenses')
     .select('*')
     .eq('user_id', user.id)
     .order('expense_date', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setExpenses(data || [])
    }
    setLoading(false)
  }

  const handleAddExpense = async () => {
    if (!description.trim()) return alert('Enter expense description')
    if (!amount || Number(amount) <= 0) return alert('Enter valid amount')

    const { data: { user } = {} } = await supabase.auth.getUser()
    if (!user) return alert('Not logged in')

    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      description: description.trim(),
      amount: Number(amount),
      category,
      expense_date: expenseDate
    })

    if (error) {
      alert('Error adding expense: ' + error.message)
      return
    }

    setDescription('')
    setAmount('')
    setCategory('Rent')
    setExpenseDate(new Date().toISOString().split('T')[0])
    setShowForm(false)
    fetchExpenses()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return

    const { error } = await supabase
     .from('expenses')
     .delete()
     .eq('id', id)

    if (error) {
      alert('Error deleting expense')
      return
    }
    fetchExpenses()
  }

  const totalThisMonth = expenses
   .filter(e => {
      const expDate = new Date(e.expense_date)
      const now = new Date()
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
    })
   .reduce((sum, e) => sum + Number(e.amount), 0)

  const inputClass = "w-full bg-white p-3 rounded border-gray-300 text-base min-h-12 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 text-gray-900">Loading expenses...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />

      <header className="bg-white shadow-sm px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Expenses</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium min-h-12 text-base"
          >
            <Plus size={20} />
            Add Expense
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6 w-full max-w-screen">
        <div className="max-w-6xl mx-auto space-y-6">

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={24} className="text-red-600" />
              <span className="text-sm text-gray-600">Total This Month</span>
            </div>
            <div className="text-3xl font-bold text-red-600">KES {totalThisMonth.toLocaleString()}</div>
          </div>

          {showForm && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Add New Expense</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Shop rent for May"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KES)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="5000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className={inputClass}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium min-h-12 text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExpense}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium min-h-12 text-base"
                >
                  Save Expense
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            {expenses.length === 0? (
              <div className="p-12 text-center">
                <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No expenses recorded yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-12 text-base"
                >
                  Add First Expense
                </button>
              </div>
            ) : (
              <table className="min-w-lg w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Date</th>
                    <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Description</th>
                    <th className="border-gray-200 border-b px-4 py-3 text-left text-gray-900 font-semibold">Category</th>
                    <th className="border-gray-200 border-b px-4 py-3 text-right text-gray-900 font-semibold">Amount</th>
                    <th className="border-gray-200 border-b px-4 py-3 text-center text-gray-900 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="border-gray-200 border-b px-4 py-3 text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="border-gray-200 border-b px-4 py-3 font-medium text-gray-900">{expense.description}</td>
                      <td className="border-gray-200 border-b px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {expense.category}
                        </span>
                      </td>
                      <td className="border-gray-200 border-b px-4 py-3 text-right font-bold text-red-600">
                        KES {Number(expense.amount).toLocaleString()}
                      </td>
                      <td className="border-gray-200 border-b px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600 min-h-12 min-w-12 flex items-center justify-center"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}