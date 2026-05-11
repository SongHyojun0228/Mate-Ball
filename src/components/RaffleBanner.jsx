import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function RaffleBanner() {
  const { user } = useAuthStore()
  const [round, setRound] = useState(null)
  const [ticketCount, setTicketCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const { data: r } = await supabase
        .from('raffle_rounds')
        .select('*')
        .eq('status', 'active')
        .maybeSingle()

      if (!r) return
      setRound(r)

      const { count } = await supabase
        .from('raffle_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('round_id', r.id)
      setTicketCount(count || 0)
    }

    load()
  }, [user])

  if (!round) return null

  return (
    <Link
      to="/raffle"
      className="block no-underline mb-3"
      style={{
        background: 'linear-gradient(135deg, #fff5e8 0%, #ffe5c2 100%)',
        border: '1.5px dashed var(--color-stitch-red)',
        borderRadius: 12, padding: '12px 14px',
        color: 'var(--color-ink)',
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <Ticket size={22} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-stitch-red)', letterSpacing: '0.02em' }}>
              제{round.round_number}라운드 치킨 추첨
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>
              매주 {round.winner_count}명에게 치킨!
            </p>
          </div>
        </div>
        <div className="text-right">
          <p style={{ fontSize: 9, color: 'var(--color-ink-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>내 응모권</p>
          <p className="num" style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-stitch-red)' }}>{ticketCount}장</p>
        </div>
      </div>
    </Link>
  )
}
