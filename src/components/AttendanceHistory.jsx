import { useState, useEffect } from 'react'
import { MapPin, Plus, X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import AttendanceCard from './AttendanceCard'
import TeamLogo from './TeamLogo'

export default function AttendanceHistory() {
  const { user, profile } = useAuthStore()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [availableGames, setAvailableGames] = useState([])
  const [loadingGames, setLoadingGames] = useState(false)
  const [adding, setAdding] = useState(false)

  const favoriteTeamId = profile?.favorite_team_id

  useEffect(() => {
    if (!user) return
    loadRecords()
  }, [user])

  const loadRecords = async () => {
    const { data } = await supabase
      .from('attendance_records')
      .select(`
        *,
        games(
          *,
          home_team:teams!games_home_team_id_fkey(*),
          away_team:teams!games_away_team_id_fkey(*)
        ),
        attendance_photos(id, photo_url, storage_path)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setRecords(data)
    setLoading(false)
  }

  const stats = (() => {
    let wins = 0, losses = 0, draws = 0
    for (const r of records) {
      const game = r.games
      if (!game || !favoriteTeamId) continue
      const isHome = favoriteTeamId === game.home_team_id
      const myScore = isHome ? game.home_score : game.away_score
      const opScore = isHome ? game.away_score : game.home_score
      if (myScore > opScore) wins++
      else if (myScore < opScore) losses++
      else draws++
    }
    const total = wins + losses + draws
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
    return { total, wins, losses, draws, winRate }
  })()

  const openAddModal = async () => {
    setShowAddModal(true)
    setLoadingGames(true)

    const { data: existingGameIds } = await supabase
      .from('attendance_records')
      .select('game_id')
      .eq('user_id', user.id)

    const recordedIds = (existingGameIds || []).map((r) => r.game_id)

    let query = supabase
      .from('games')
      .select('*, home_team:teams!games_home_team_id_fkey(*), away_team:teams!games_away_team_id_fkey(*)')
      .eq('status', 'finished')
      .order('date', { ascending: false })
      .limit(50)

    if (favoriteTeamId) {
      query = query.or(`home_team_id.eq.${favoriteTeamId},away_team_id.eq.${favoriteTeamId}`)
    }

    const { data: games } = await query

    const filtered = (games || []).filter((g) => !recordedIds.includes(g.id))
    setAvailableGames(filtered)
    setLoadingGames(false)
  }

  const addRecord = async (gameId) => {
    setAdding(true)
    const { error } = await supabase
      .from('attendance_records')
      .insert({ user_id: user.id, game_id: gameId, source: 'manual' })

    if (!error) {
      setShowAddModal(false)
      await loadRecords()
    }
    setAdding(false)
  }

  const handleDelete = (id) => {
    setRecords(records.filter((r) => r.id !== id))
  }

  const handleUpdate = (updated) => {
    setRecords(records.map((r) => r.id === updated.id ? updated : r))
  }

  if (loading) {
    return <p className="text-center py-6" style={{ color: 'var(--color-ink-muted)' }}>투구 준비 중...</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
        {[
          ['직관', stats.total],
          ['승', stats.wins],
          ['패', stats.losses],
          ['무', stats.draws],
          ['승률', stats.total > 0 ? `${stats.winRate}%` : '-'],
        ].map(([label, value]) => (
          <div key={label} className="stat-tile" style={{ padding: '8px 4px' }}>
            <div className="stat-num" style={{ fontSize: 18 }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Add record button */}
      <button
        onClick={openAddModal}
        className="btn-ghost flex items-center justify-center gap-1.5"
        style={{ width: '100%', borderStyle: 'dashed', padding: 14 }}
      >
        <Plus size={16} />
        직관 기록 추가
      </button>

      {/* Record list */}
      {records.length === 0 ? (
        <div className="ball-card text-center" style={{ padding: '32px 20px' }}>
          <MapPin size={28} style={{ color: 'var(--color-line)', margin: '0 auto 6px' }} />
          <p style={{ color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: 14 }}>아직 직관 기록이 없어요</p>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 12, marginTop: 2 }}>
            경기방에서 "직관 갔어요" 버튼을 눌러보세요
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {records.map((record) => (
            <AttendanceCard
              key={record.id}
              record={record}
              favoriteTeamId={favoriteTeamId}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      {/* Game selection modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div style={{
            background: 'var(--color-ball-white)',
            borderRadius: '16px 16px 0 0',
            width: '100%', maxWidth: 480,
            maxHeight: '70vh', display: 'flex', flexDirection: 'column',
          }}>
            <div className="flex items-center justify-between" style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-line)',
            }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>직관 간 경기 선택</span>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: 16 }} className="flex flex-col gap-2">
              {loadingGames ? (
                <div className="flex items-center justify-center gap-2 py-8" style={{ color: 'var(--color-ink-muted)' }}>
                  <Loader2 size={16} className="animate-spin" />
                  경기 목록 불러오는 중...
                </div>
              ) : availableGames.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--color-ink-muted)', fontSize: 13 }}>
                  기록할 수 있는 경기가 없어요
                </p>
              ) : (
                availableGames.map((game) => {
                  const dateObj = new Date(game.date)
                  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
                  const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} (${dayNames[dateObj.getDay()]})`
                  return (
                    <button
                      key={game.id}
                      onClick={() => addRecord(game.id)}
                      disabled={adding}
                      className="ball-card"
                      style={{
                        padding: 12, cursor: 'pointer', textAlign: 'left',
                        opacity: adding ? 0.5 : 1,
                      }}
                    >
                      <span className="num" style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 700 }}>
                        {dateStr}
                      </span>
                      <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                        <TeamLogo team={game.away_team} size={18} />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{game.away_team?.name}</span>
                        <span className="num" style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-stitch-red)' }}>
                          {game.away_score} : {game.home_score}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{game.home_team?.name}</span>
                        <TeamLogo team={game.home_team} size={18} />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
