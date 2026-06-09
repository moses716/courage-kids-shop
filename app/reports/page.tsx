'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('2026-06-09')
  const [dateTo, setDateTo] = useState('2026-06-09')
  const [activeTab, setActiveTab] = useState('pnl')

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">Track your shop performance</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border-gray-200 p-2 mb-6">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('pnl')}
              className={`py-3 rounded-lg font-medium transition ${
                activeTab === 'pnl' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Daily P&L
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-3 rounded-lg font-medium transition ${
                activeTab === 'customers' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setActiveTab('cashiers')}
              className={`py-3 rounded-lg font-medium transition ${
                activeTab === 'cashiers' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cashiers
            </button>
          </div>
        </div>

        {/* Date Range + Export */}
        <div className="bg-white rounded-xl shadow-sm border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              />
            </div>
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 min-h-12 whitespace-nowrap">
              ↓ Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-2">Revenue</p>
            <p className="text-3xl font-bold text-gray-900">KES 0</p>
            <p className="text-sm text-gray-400 mt-1">Total Sales</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-2">Costs</p>
            <p className="text-3xl font-bold text-gray-900">KES 0</p>
            <p className="text-sm text-gray-400 mt-1">0 transactions</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-500 p-6">
            <p className="text-sm text-gray-500 mb-2">Gross Profit</p>
            <p className="text-3xl font-bold text-green-600">KES 0</p>
            <p className="text-sm text-gray-400 mt-1">Margin: 0%</p>
          </div>
        </div>

        {/* Average Sale Card */}
        <div className="bg-white rounded-xl shadow-sm border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-2">Average Sale</p>
          <p className="text-3xl font-bold text-gray-900">KES 0</p>
        </div>
      </div>
    </div>
  )
}