import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import GameCard from '../components/GameCard'
import RaffleBanner from '../components/RaffleBanner'
import MatchReminder from '../components/MatchReminder'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekDates(weekOffset) {
  const today = new Date()
  const base = new Date(today)
  base.setDate(today.getDate() + weekOffset * 7 - 3)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    dates.push(d)
  }
  return dates
}

export default function Home() {
  const { user, profile, loading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()))
  const [userPredictions, setUserPredictions] = useState(new Set())

  const todayStr = formatDate(new Date())
  const weekDates = getWeekDates(weekOffset)

  useEffect(() => {
    if (!authLoading && user && profile && !profile.favorite_team_id) {
      navigate('/team-select', { replace: true })
    }
  }, [authLoading, user, profile, navigate])

  const fetchGames = useCallback(async (dateStr) => {
    setLoading(true)
    const { data } = await supabase
      .from('games')
      .select('*, home_team:teams!games_home_team_id_fkey(*), away_team:teams!games_away_team_id_fkey(*)')
      .eq('date', dateStr)
      .order('time')

    if (data) {
      setGames(data)
      if (user && data.length > 0) {
        const gameIds = data.map((g) => g.id)
        const { data: preds } = await supabase
          .from('predictions')
          .select('game_id')
          .eq('user_id', user.id)
          .in('game_id', gameIds)
        setUserPredictions(new Set((preds || []).map((p) => p.game_id)))
      } else {
        setUserPredictions(new Set())
      }
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchGames(selectedDate)
  }, [selectedDate, fetchGames])

  const today = new Date()
  const monthYear = `${today.getFullYear()}년 ${today.getMonth() + 1}월`

  return (
    <div>
      {/* Date strip card */}
      <div className="ball-card" style={{ padding: 10, marginBottom: 12 }}>
        <div className="flex items-center gap-1 mb-2" style={{ paddingLeft: 4 }}>
          <Clock size={13} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.02em' }}>
            {monthYear} · 경기 일정
          </span>
        </div>
        <div className="flex items-stretch gap-1">
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--color-ink-muted)', cursor: 'pointer',
              padding: '0 4px', fontSize: 16,
            }}
          >
            &#8249;
          </button>
          {weekDates.map((date) => {
            const dateStr = formatDate(date)
            const isSelected = dateStr === selectedDate
            const isPast = dateStr < todayStr
            const dayName = DAY_NAMES[date.getDay()]
            const isSunday = date.getDay() === 0
            const isSaturday = date.getDay() === 6

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  flex: 1, padding: '6px 0', border: 'none', borderRadius: 6,
                  cursor: 'pointer',
                  background: isSelected ? 'var(--color-stitch-red)' : isPast ? 'var(--color-line-soft)' : 'transparent',
                  color: isSelected ? 'white'
                    : isSunday ? 'var(--color-stitch-red)'
                    : isSaturday ? 'var(--color-grass-mid)'
                    : 'var(--color-ink)',
                  outline: isSelected ? '1.5px dashed rgba(255,255,255,0.5)' : 'none',
                  outlineOffset: '-3px',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}>{dayName}</div>
                <div className="num" style={{ fontWeight: 800, fontSize: 14 }}>{date.getDate()}</div>
              </button>
            )
          })}
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--color-ink-muted)', cursor: 'pointer',
              padding: '0 4px', fontSize: 16,
            }}
          >
            &#8250;
          </button>
        </div>
      </div>

      {/* D-1 match reminder */}
      {user && <MatchReminder />}

      {/* Raffle banner */}
      {user && <RaffleBanner />}

      {/* Game list */}
      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--color-ink-muted)' }}>
          투구 준비 중...
        </div>
      ) : games.length === 0 ? (
        <div className="ball-card text-center" style={{ padding: '40px 20px' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink-muted)' }}>이 날은 경기가 없어요</p>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginTop: 4 }}>다른 날짜를 확인해봐요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {games.map((game) => (
            <GameCard key={game.id} game={game} hasPredicted={userPredictions.has(game.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
