import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import GameCard from '../components/GameCard'
import RaffleBanner from '../components/RaffleBanner'
import MatchReminder from '../components/MatchReminder'
import TeamLogo from '../components/TeamLogo'

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
  const [standings, setStandings] = useState([])
  const [standingsOpen, setStandingsOpen] = useState(() => {
    try { return localStorage.getItem('yame_standings_open') === 'true' } catch { return false }
  })

  const todayStr = formatDate(new Date())
  const weekDates = getWeekDates(weekOffset)

  useEffect(() => {
    if (!authLoading && user && profile && !profile.favorite_team_id) {
      navigate('/team-select', { replace: true })
    }
  }, [authLoading, user, profile, navigate])

  useEffect(() => {
    supabase
      .from('team_standings')
      .select('*, teams(name, logo_url)')
      .order('rank')
      .then(({ data }) => {
        if (data) setStandings(data)
      })
  }, [])

  const toggleStandings = () => {
    const next = !standingsOpen
    setStandingsOpen(next)
    try { localStorage.setItem('yame_standings_open', String(next)) } catch {}
  }

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

      {/* 구단 순위표 */}
      {standings.length > 0 && (
        <div className="ball-card" style={{ padding: 0, marginBottom: 12, overflow: 'hidden' }}>
          <button
            onClick={toggleStandings}
            className="flex items-center justify-between"
            style={{
              width: '100%', padding: '12px 14px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-ink)', fontWeight: 800, fontSize: 13,
            }}
          >
            <div className="flex items-center gap-1.5">
              <Trophy size={14} style={{ color: 'var(--color-stitch-red)' }} />
              구단 순위
            </div>
            {standingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {standingsOpen && (
            <div style={{ padding: '0 10px 12px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--color-line)', color: 'var(--color-ink-muted)', fontWeight: 700 }}>
                    <th style={{ padding: '6px 3px', textAlign: 'center', width: 24 }}>#</th>
                    <th style={{ padding: '6px 3px', textAlign: 'left' }}>팀</th>
                    <th style={{ padding: '6px 3px', textAlign: 'center' }}>경기</th>
                    <th style={{ padding: '6px 3px', textAlign: 'center' }}>승</th>
                    <th style={{ padding: '6px 3px', textAlign: 'center' }}>패</th>
                    <th style={{ padding: '6px 3px', textAlign: 'center' }}>무</th>
                    <th style={{ padding: '6px 3px', textAlign: 'center' }}>승률</th>
                    <th style={{ padding: '6px 3px', textAlign: 'center' }}>차</th>
                    <th style={{ padding: '6px 3px', textAlign: 'center' }}>연속</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team) => {
                    const isMyTeam = profile?.favorite_team_id === team.team_id
                    const teamName = team.teams?.name || team.team_id
                    const logoUrl = team.teams?.logo_url
                    return (
                      <tr
                        key={team.team_id}
                        style={{
                          borderBottom: '1px solid var(--color-line-soft)',
                          background: isMyTeam ? 'rgba(200,32,43,0.06)' : 'transparent',
                          fontWeight: isMyTeam ? 800 : 600,
                        }}
                      >
                        <td className="num" style={{ padding: '7px 3px', textAlign: 'center', fontWeight: 800, color: team.rank <= 3 ? 'var(--color-stitch-red)' : 'var(--color-ink-soft)' }}>
                          {team.rank}
                        </td>
                        <td style={{ padding: '7px 3px' }}>
                          <div className="flex items-center gap-1.5">
                            <TeamLogo team={{ id: team.team_id, logo_url: logoUrl, name: teamName }} size={18} />
                            <span style={{ fontSize: 11, fontWeight: isMyTeam ? 800 : 700 }}>{teamName}</span>
                          </div>
                        </td>
                        <td className="num" style={{ padding: '7px 3px', textAlign: 'center' }}>{team.games_played}</td>
                        <td className="num" style={{ padding: '7px 3px', textAlign: 'center' }}>{team.wins}</td>
                        <td className="num" style={{ padding: '7px 3px', textAlign: 'center' }}>{team.losses}</td>
                        <td className="num" style={{ padding: '7px 3px', textAlign: 'center' }}>{team.draws}</td>
                        <td className="num" style={{ padding: '7px 3px', textAlign: 'center', fontWeight: 800 }}>
                          {Number(team.win_rate).toFixed(3).slice(1)}
                        </td>
                        <td className="num" style={{ padding: '7px 3px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                          {team.games_behind}
                        </td>
                        <td style={{ padding: '7px 3px', textAlign: 'center', fontSize: 10, color: team.streak?.includes('승') ? 'var(--color-grass-mid)' : 'var(--color-stitch-red)' }}>
                          {team.streak}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
