'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Bale = {
  id: string
  name: string
}

export default function POSPage() {
  const [loading, setLoading] = useState(true)
  const [bales, setBales] = useState<Bale[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      // Angalia kama user ame-login kwanza
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }

      // Fetch data BAADA ya kuthibitisha user
      const { data, error: fetchError } = await supabase.from('bales').select('*')
      if (fetchError) {
        console.error('Error fetching bales:', fetchError)
      } else {
        setBales(data || [])
      }
      
      setLoading(false)
    }
    init()
  }, [router, supabase])

  if (loading) return <div style={{padding: 20}}>Loading...</div>

  return (
    <div style={{padding: 20}}>
      <h1>POS Dashboard</h1>
      {bales.length === 0 ? (
        <p>Hakuna bales zilizopatikana</p>
      ) : (
        bales.map(b => <div key={b.id}>{b.name}</div>)
      )}
    </div>
  )
}