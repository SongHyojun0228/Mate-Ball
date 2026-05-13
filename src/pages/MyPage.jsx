import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, MapPin, Star, Trophy, Award, Share2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import TeamLogo from '../components/TeamLogo'
import AttendanceHistory from '../components/AttendanceHistory'
import ShareCard from '../components/ShareCard'
import SharePreviewModal from '../components/SharePreviewModal'

const tabs = [
  { id: 'predictions', label: '예측 기록', icon: TrendingUp },
  { id: 'attendance', label: '직관 기록', icon: MapPin },
]

export default function MyPage() {
  const { user, profile, deleteAccount } = useAuthStore()
  const navigate = useNavigate()
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('predictions')
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [attendanceWinRate, setAttendanceWinRate] = useState(null)
  const [rankingData, setRankingData] = useState(null) // { rank, totalRanked, isTop5Pct }
  const [isRankFirst, setIsRankFirst] = useState(false)
  const [bestGame, setBestGame] = useState(null)
  const [showStatsPreview, setShowStatsPreview] = useState(false)

  useEffect(() => {
    if (!user) return

    const loadAll = async () => {
      const { data } = await supabase
        .from('predictions')
        .select('*, games(*, home_team:teams!games_home_team_id_fkey(*), away_team:teams!games_away_team_id_fkey(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setPredictions(data)

      const { data: attendances } = await supabase
        .from('attendance_records')
        .select('game_id, games(date, home_team_id, away_team_id, home_score, away_score, home_team:teams!games_home_team_id_fkey(name), away_team:teams!games_away_team_id_fkey(name))')
        .eq('user_id', user.id)

      if (attendances) {
        setAttendanceCount(attendances.length)
        const fav = profile?.favorite_team_id
        if (fav && attendances.length > 0) {
          let w = 0, total = 0
          let recentWin = null
          for (const a of attendances) {
            const g = a.games
            if (!g) continue
            const isHome = fav === g.home_team_id
            const my = isHome ? g.home_score : g.away_score
            const op = isHome ? g.away_score : g.home_score
            total++
            if (my > op) {
              w++
              if (!recentWin || g.date > recentWin.date) recentWin = g
            }
          }
          setAttendanceWinRate(total > 0 ? Math.round((w / total) * 100) : 0)

          if (recentWin) {
            const d = new Date(recentWin.date + 'T00:00:00')
            setBestGame({
              dateLabel: `${d.getMonth() + 1}월 ${d.getDate()}일`,
              homeTeam: recentWin.home_team?.name || '',
              awayTeam: recentWin.away_team?.name || '',
              homeScore: recentWin.home_score,
              awayScore: recentWin.away_score,
              isWin: true,
            })
          }
        }
      }

      // Fetch ranking data for titles
      const { count: totalRanked } = await supabase
        .from('prediction_rankings')
        .select('*', { count: 'exact', head: true })

      const { data: myRanking } = await supabase
        .from('prediction_rankings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (myRanking && totalRanked) {
        const { count: aboveMe } = await supabase
          .from('prediction_rankings')
          .select('*', { count: 'exact', head: true })
          .gt('accuracy_pct', myRanking.accuracy_pct)
        const rank = (aboveMe || 0) + 1
        const pct = Math.round((rank / totalRanked) * 100)
        setRankingData({ rank, totalRanked, topPct: pct })
        setIsRankFirst(rank === 1)
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
              </div>
            )}
            {/* Titles */}
            {(() => {
              const titles = []
              if (isRankFirst) titles.push({ label: '예측왕', bg: '#FFD700', color: '#1A1A2E' })
              if (rankingData?.topPct <= 5 && judged.length >= 10) titles.push({ label: '적중 장인', bg: 'var(--color-stitch-red)', color: 'white' })
              if (attendanceCount >= 10) titles.push({ label: '직관의 신', bg: 'var(--color-grass-mid)', color: 'white' })
              if (profile?.rating_avg >= 4.5) titles.push({ label: '매너 MVP', bg: 'var(--color-ink)', color: 'white' })
              else if (profile?.rating_avg >= 3.5) titles.push({ label: '매너 올스타', bg: 'var(--color-stitch-red)', color: 'white' })
              if (titles.length === 0) return null
              return (
                <div className="flex flex-wrap gap-1.5" style={{ marginTop: 6 }}>
                  {titles.map((t) => (
                    <span key={t.label} className="flex items-center gap-1" style={{
                      background: t.bg, color: t.color,
                      fontSize: 10, fontWeight: 800, padding: '3px 8px',
                      borderRadius: 999, letterSpacing: '0.03em',
                    }}>
                      <Award size={10} />
                      {t.label}
                    </span>
                  ))}
                </div>
              )
            })()}
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
        {rankingData && (
          <div className="flex items-center justify-center gap-1.5" style={{
            marginTop: 8, fontSize: 12, fontWeight: 800,
            color: 'var(--color-grass-deep)',
          }}>
            <Trophy size={13} />
            전국 야구 팬 중 상위 {rankingData.topPct}%
          </div>
        )}
        <Link
          to="/ranking"
          className="no-underline flex items-center justify-center gap-1.5"
          style={{
            marginTop: 6, fontSize: 12, fontWeight: 700,
            color: 'var(--color-stitch-red)',
          }}
        >
          <Trophy size={13} />
          전체 랭킹 보기 &gt;
        </Link>
        <button
          onClick={() => setShowStatsPreview(true)}
          className="flex items-center justify-center gap-1.5"
          style={{
            marginTop: 8,
            width: '100%',
            padding: '10px 0',
            background: 'var(--color-ink)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <Share2 size={14} />
          공유 카드 만들기
        </button>
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

      {/* Stats share preview modal */}
      <SharePreviewModal
        open={showStatsPreview}
        onClose={() => setShowStatsPreview(false)}
        cardWidth={360}
        cardHeight={640}
        captureScale={4}
        filename="mateball_stats.png"
      >
        <ShareCard
          profile={profile}
          total={total}
          correct={correct.length}
          accuracy={accuracy}
          attendanceCount={attendanceCount}
          attendanceWinRate={attendanceWinRate}
          rankingData={rankingData}
          isRankFirst={isRankFirst}
          judgedCount={judged.length}
          bestGame={bestGame}
        />
      </SharePreviewModal>
    </div>
  )
}
