'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  
  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/sales', label: 'Sales' },
    { href: '/customers', label: 'Customers' },
    { href: '/pos', label: 'POS' },
    { href: '/settings', label: 'Settings' },
  ]

  const showBack = pathname !== '/dashboard'

  return (
    <nav className="bg-white border-b shadow-sm px-6 py-3 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <button 
              onClick={() => window.history.back()} 
              className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <h2 className="font-bold text-lg text-gray-800">COURAGE KIDS SHOP</h2>
        </div>
        
        <div className="flex gap-6">
          {links.map(link => (
            <Link 
              key={link.href}
              href={link.href}
              className={`font-medium text-sm ${pathname === link.href ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-600 hover:text-blue-600'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}