import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

function getTomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function MatchReminder() {
  const { user } = useAuthStore()
  const [reminders, setReminders] = useState([])

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const tomorrow = getTomorrowStr()

      // 내가 작성한 매칭 글 중 내일 경기 + accepted 된 것
      const { data: myPosts } = await supabase
        .from('match_requests')
        .select(`
          id,
          requester_id,
          requester:profiles!match_requests_requester_id_fkey(nickname),
          post:match_posts!match_requests_post_id_fkey(
            user_id,
            game:games!match_posts_game_id_fkey(
              id, date, time, stadium,
              home_team:teams!games_home_team_id_fkey(name),
              away_team:teams!games_away_team_id_fkey(name)
            )
          )
        `)
        .eq('status', 'accepted')

      if (!myPosts) return

      const items = myPosts.filter((mr) => {
        const game = mr.post?.game
        if (!game || game.date !== tomorrow) return false
        return mr.requester_id === user.id || mr.post.user_id === user.id
      }).map((mr) => {
        const game = mr.post.game
        const isRequester = mr.requester_id === user.id
        const partnerName = isRequester ? '글 작성자' : mr.requester?.nickname || '매칭 상대'
        return {
          id: mr.id,
          game,
          partnerName,
        }
      })

      setReminders(items)
    }

    load()
  }, [user])

  if (reminders.length === 0) return null

  return (
    <div className="flex flex-col gap-2" style={{ marginBottom: 12 }}>
      {reminders.map((r) => (
        <Link
          key={r.id}
          to="/messages"
          className="ball-card block no-underline"
          style={{
            padding: '12px 14px',
            border: '1.5px solid var(--color-grass-mid)',
            color: 'var(--color-ink)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <Bell size={18} style={{ color: 'var(--color-grass-mid)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                내일 직관 D-1!
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontWeight: 600, marginTop: 2 }}>
                {r.game.away_team?.name} vs {r.game.home_team?.name}
                {r.game.time && ` · ${r.game.time.slice(0, 5)}`}
                {' · '}{r.partnerName}과 직관
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
