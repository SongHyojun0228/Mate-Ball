import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Users, MessageCircle, MapPin, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import PredictionTab from '../components/PredictionTab'
import MatchTab from '../components/MatchTab'
import TalkTab from '../components/TalkTab'
import TeamLogo from '../components/TeamLogo'

const tabs = [
  { id: 'prediction', label: '승부예측', icon: TrendingUp },
  { id: 'match', label: '직관매칭', icon: Users },
  { id: 'talk', label: '응원토크', icon: MessageCircle },
]

export default function GameRoom() {
  const { gameId } = useParams()
  const { user, profile } = useAuthStore()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('prediction')
  const [attendanceRecord, setAttendanceRecord] = useState(null)
  const [addingAttendance, setAddingAttendance] = useState(false)

  const isMyGame =
    profile?.favorite_team_id &&
    (profile.favorite_team_id === game?.home_team_id ||
      profile.favorite_team_id === game?.away_team_id)

  useEffect(() => {
    supabase
      .from('games')
      .select('*, home_team:teams!games_home_team_id_fkey(*), away_team:teams!games_away_team_id_fkey(*)')
      .eq('id', gameId)
      .single()
      .then(({ data }) => {
        if (data) setGame(data)
        setLoading(false)
      })
  }, [gameId])

  // 직관 기록 확인
  useEffect(() => {
    if (!user || !gameId) return
    supabase
      .from('attendance_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .maybeSingle()
      .then(({ data }) => {
        setAttendanceRecord(data)
      })
  }, [user, gameId])

  const handleAddAttendance = async () => {
    if (!user || !gameId) return
    setAddingAttendance(true)
    const { data, error } = await supabase
      .from('attendance_records')
      .insert({ user_id: user.id, game_id: gameId, source: 'manual' })
      .select()
      .single()
    if (!error && data) {
      setAttendanceRecord(data)
    }
    setAddingAttendance(false)
  }

  if (loading) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--color-ink-muted)' }}>
        투구 준비 중...
      </div>
    )
  }

  if (!game) {
    return (
      <div className="text-center py-20">
        <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-stitch-red)', marginBottom: 8 }}>
          경기를 찾을 수 없어요
        </p>
        <Link to="/" style={{ color: 'var(--color-stitch-red)', fontWeight: 700, fontSize: 14 }}>
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  const isLive = game.status === 'live'
  const isFinished = game.status === 'finished'
  const isCancelled = game.status === 'cancelled'
  const showScore = isLive || isFinished

  const statusLabel = isLive ? '진행중' : isFinished ? '종료' : isCancelled ? '취소' : '예정'
  const statusBadgeClass = isLive ? 'badge-live' : isFinished ? 'badge-final' : isCancelled ? 'badge-cancelled' : 'badge-scheduled'

  return (
    <div>
      {/* 뒤로가기 */}
      <Link
        to="/"
        className="flex items-center gap-1 no-underline"
        style={{ color: 'var(--color-ink)', fontSize: 14, fontWeight: 700, padding: '6px 0', marginBottom: 8 }}
      >
        <ArrowLeft size={18} />
        오늘의 경기
      </Link>

      {/* Hero match card */}
      <div className="ball-card" style={{ padding: 16, position: 'relative', overflow: 'hidden', marginBottom: 0 }}>
        {/* Red top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--color-stitch-red)' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
          {/* Away */}
          <div className="flex flex-col items-center gap-1.5">
            <TeamLogo team={game.away_team} size={50} />
            <span style={{ fontSize: 14, fontWeight: 800 }}>{game.away_team?.name}</span>
            <span style={{ fontSize: 10, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
              원정{game.away_pitcher ? ` · ${game.away_pitcher}` : ''}
            </span>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center" style={{ minWidth: 92 }}>
            {showScore ? (
              <div className="scoreboard" style={{ padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className="value" style={{ fontSize: 22 }}>{game.away_score}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>:</span>
                <span className="value" style={{ fontSize: 22 }}>{game.home_score}</span>
              </div>
            ) : (
              <>
                <span className="num" style={{ fontWeight: 800, fontSize: 28, color: 'var(--color-stitch-red)' }}>VS</span>
                <span className="num" style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>
                  {game.time?.slice(0, 5)}
                </span>
              </>
            )}
            <span className={`badge ${statusBadgeClass}`} style={{ marginTop: 6 }}>
              {statusLabel}
            </span>
          </div>

          {/* Home */}
          <div className="flex flex-col items-center gap-1.5">
            <TeamLogo team={game.home_team} size={50} />
            <span style={{ fontSize: 14, fontWeight: 800 }}>{game.home_team?.name}</span>
            <span style={{ fontSize: 10, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
              홈{game.home_pitcher ? ` · ${game.home_pitcher}` : ''}
            </span>
          </div>
        </div>

        {/* Stadium */}
        {game.stadium && (
          <div className="flex items-center justify-center gap-1" style={{ marginTop: 10, fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
            <MapPin size={11} />
            {game.stadium}
          </div>
        )}
      </div>

      {/* 다른 팀 경기 안내 */}
      {!isMyGame && profile?.favorite_team_id && (
        <div style={{
          background: 'var(--color-ball-white)', border: '1px solid var(--color-line)',
          borderRadius: 8, padding: '8px 12px', marginTop: 10,
          fontSize: 12, color: 'var(--color-ink-soft)', fontWeight: 600, textAlign: 'center',
        }}>
          내 응원팀 경기는 아니지만, 승부예측은 할 수 있어요!
        </div>
      )}

      {/* 직관 갔어요 버튼 */}
      {isMyGame && (isFinished || isLive) && (
        attendanceRecord ? (
          <div className="flex items-center justify-center gap-2" style={{
            background: 'rgba(46,107,61,0.1)', borderRadius: 10,
            padding: '10px 16px', marginTop: 10,
            color: 'var(--color-grass-mid)', fontWeight: 700, fontSize: 13,
          }}>
            <Check size={16} />
            직관 기록 완료
          </div>
        ) : (
          <button
            onClick={handleAddAttendance}
            disabled={addingAttendance}
            className="btn-stitch"
            style={{ marginTop: 10, padding: '10px 16px', fontSize: 13 }}
          >
            <MapPin size={16} />
            {addingAttendance ? '기록 중...' : '직관 갔어요!'}
          </button>
        )
      )}

      {/* Dugout tabs */}
      <div className="dugout-tabs" style={{ marginTop: 12 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isDisabled = tab.id === 'talk' && !isMyGame
          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ paddingTop: 12 }}>
        {activeTab === 'prediction' && <PredictionTab game={game} />}
        {activeTab === 'match' && <MatchTab game={game} isMyGame={isMyGame} />}
        {activeTab === 'talk' && <TalkTab game={game} />}
      </div>
    </div>
  )
}
