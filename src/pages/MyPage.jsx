import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, MapPin, Star, Ticket, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import TeamLogo from '../components/TeamLogo'
import AttendanceHistory from '../components/AttendanceHistory'

const tabs = [
  { id: 'predictions', label: '예측 기록', icon: TrendingUp },
  { id: 'attendance', label: '직관 기록', icon: MapPin },
]

export default function MyPage() {
  const { user, profile, deleteAccount } = useAuthStore()
  const navigate = useNavigate()
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [ticketCount, setTicketCount] = useState(0)
  const [myWins, setMyWins] = useState([])
  const [activeTab, setActiveTab] = useState('predictions')
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [attendanceWinRate, setAttendanceWinRate] = useState(null)

  useEffect(() => {
    if (!user) return

    const loadAll = async () => {
      const { data } = await supabase
        .from('predictions')
        .select('*, games(*, home_team:teams!games_home_team_id_fkey(*), away_team:teams!games_away_team_id_fkey(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setPredictions(data)

      const { data: activeRound } = await supabase
        .from('raffle_rounds')
        .select('id')
        .eq('status', 'active')
        .maybeSingle()

      if (activeRound) {
        const { count } = await supabase
          .from('raffle_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('round_id', activeRound.id)
        setTicketCount(count || 0)
      }

      const { data: wins } = await supabase
        .from('raffle_winners')
        .select('*, raffle_rounds(round_number, prize)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (wins) setMyWins(wins)

      const { data: attendances } = await supabase
        .from('attendance_records')
        .select('game_id, games(home_team_id, away_team_id, home_score, away_score)')
        .eq('user_id', user.id)

      if (attendances) {
        setAttendanceCount(attendances.length)
        const fav = profile?.favorite_team_id
        if (fav && attendances.length > 0) {
          let w = 0, total = 0
          for (const a of attendances) {
            const g = a.games
            if (!g) continue
            const isHome = fav === g.home_team_id
            const my = isHome ? g.home_score : g.away_score
            const op = isHome ? g.away_score : g.home_score
            total++
            if (my > op) w++
          }
          setAttendanceWinRate(total > 0 ? Math.round((w / total) * 100) : 0)
        }
      }

      setLoading(false)
    }

    loadAll()
  }, [user])

  const total = predictions.length
  const judged = predictions.filter((p) => p.is_correct === true || p.is_correct === false)
  const correct = judged.filter((p) => p.is_correct === true)
  const accuracy = judged.length > 0 ? Math.round((correct.length / judged.length) * 100) : 0

  const predictionLabel = (p, game) => {
    if (p === 'home') return game?.home_team?.name || '홈팀'
    if (p === 'away') return game?.away_team?.name || '원정팀'
    return '무승부'
  }

  return (
    <div>
      {/* Player card hero */}
      <div className="ball-card" style={{ padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        {/* Team color tint */}
        {profile?.teams?.primary_color && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 32,
            background: profile.teams.primary_color, opacity: 0.18,
          }} />
        )}
        <div className="flex gap-3 items-center" style={{ position: 'relative' }}>
          {/* Avatar */}
          <div className="num" style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--color-grass-deep)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 26,
            border: '3px solid var(--color-ball-white)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            {profile?.nickname?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'BagelFat, sans-serif', fontSize: 18 }}>{profile?.nickname}</div>
            {profile?.teams && (
              <div className="flex items-center gap-1" style={{ fontSize: 12, marginTop: 2 }}>
                <TeamLogo team={profile.teams} size={14} />
                <span style={{ fontFamily: 'BagelFat, sans-serif', fontSize: 12 }}>{profile.teams.name}</span>
              </div>
            )}
            {profile?.rating_avg > 0 && (
              <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
                <Star size={13} fill="var(--color-stitch-red)" stroke="var(--color-stitch-red)" />
                <span className="num" style={{ fontWeight: 800, fontSize: 13, color: 'var(--color-stitch-red)' }}>
                  {profile.rating_avg}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600 }}>직관 매너</span>
                {profile.rating_avg >= 4.5 && (
                  <span style={{
                    background: 'var(--color-ink)', color: 'white',
                    fontSize: 10, fontWeight: 800, padding: '2px 6px',
                    borderRadius: 4, letterSpacing: '0.05em',
                  }}>MVP</span>
                )}
                {profile.rating_avg >= 3.5 && profile.rating_avg < 4.5 && (
                  <span style={{
                    background: 'var(--color-stitch-red)', color: 'white',
                    fontSize: 10, fontWeight: 800, padding: '2px 6px',
                    borderRadius: 4, letterSpacing: '0.05em',
                  }}>올스타</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEASON STATS grid */}
      <div className="ball-card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.15em',
          color: 'var(--color-ink-muted)', marginBottom: 8,
        }}>
          SEASON STATS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
          {[
            ['총예측', total],
            ['적중', correct.length],
            ['적중률', judged.length > 0 ? `${accuracy}%` : '-'],
            ['직관', attendanceCount],
            ['승률', attendanceWinRate !== null ? `${attendanceWinRate}%` : '-'],
          ].map(([label, value]) => (
            <div key={label} className="stat-tile" style={{ padding: '8px 4px' }}>
              <div className="stat-num" style={{ fontSize: 18 }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
        <Link
          to="/ranking"
          className="no-underline flex items-center justify-center gap-1.5"
          style={{
            marginTop: 8, fontSize: 12, fontWeight: 700,
            color: 'var(--color-stitch-red)',
          }}
        >
          <Trophy size={13} />
          전체 랭킹 보기 &gt;
        </Link>
      </div>

      {/* Draw ticket mini */}
      <div className="ball-card flex justify-between items-center" style={{ padding: 14, marginBottom: 12 }}>
        <div className="flex items-center gap-2.5">
          <Ticket size={22} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>치킨 추첨</div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
              이번 주 응모권 {ticketCount}장 · 총 당첨 {myWins.length}회
            </div>
          </div>
        </div>
        <Link to="/raffle" className="btn-ghost no-underline" style={{ padding: '6px 12px', fontSize: 12 }}>
          보기
        </Link>
      </div>

      {/* Dugout tabs */}
      <div className="dugout-tabs" style={{ marginBottom: 12 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'predictions' && (
        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-center py-6" style={{ color: 'var(--color-ink-muted)' }}>투구 준비 중...</p>
          ) : predictions.length === 0 ? (
            <div className="ball-card text-center" style={{ padding: '32px 20px' }}>
              <p style={{ color: 'var(--color-ink-muted)', fontWeight: 700 }}>아직 예측 기록이 없어요</p>
              <Link to="/" style={{ color: 'var(--color-stitch-red)', fontSize: 13, fontWeight: 700 }}>
                경기방에서 첫 예측을 해봐요!
              </Link>
            </div>
          ) : (
            predictions.map((pred) => {
              const game = pred.games
              return (
                <Link
                  key={pred.id}
                  to={`/games/${pred.game_id}`}
                  className="ball-card block no-underline"
                  style={{ padding: 14, color: 'var(--color-ink)' }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="num" style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 700 }}>
                        {game?.date}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>
                        {game?.away_team?.name}{' '}
                        <span style={{ color: 'var(--color-stitch-red)' }}>vs</span>{' '}
                        {game?.home_team?.name}
                      </div>
                      {game?.stadium && (
                        <div style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600, marginTop: 2 }}>
                          {game.stadium}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {pred.is_correct === true ? (
                        <span className="badge badge-hit">적중</span>
                      ) : pred.is_correct === false ? (
                        <span className="badge badge-miss">아쉽</span>
                      ) : (
                        <span className="badge badge-scheduled">대기중</span>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', fontWeight: 700, marginTop: 6 }}>
                        {predictionLabel(pred.prediction, game)} 승
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'attendance' && <AttendanceHistory />}

      {/* 회원탈퇴 */}
      <div className="text-center" style={{ marginTop: 32, paddingBottom: 20 }}>
        <button
          onClick={async () => {
            if (!window.confirm('정말 탈퇴하시겠어요?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) return
            try {
              await deleteAccount()
              navigate('/login')
            } catch {
              alert('탈퇴 처리 중 오류가 발생했어요.')
            }
          }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--color-ink-muted)', fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          회원탈퇴
        </button>
      </div>
    </div>
  )
}
