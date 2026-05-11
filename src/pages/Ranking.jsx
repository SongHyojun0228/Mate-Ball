import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import TeamLogo from '../components/TeamLogo'

export default function Ranking() {
  const { user } = useAuthStore()
  const [rankings, setRankings] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('accuracy') // 'accuracy' | 'correct'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const orderCol = sortBy === 'accuracy' ? 'accuracy_pct' : 'correct'
      const { data } = await supabase
        .from('prediction_rankings')
        .select('*')
        .order(orderCol, { ascending: false })
        .order('correct', { ascending: false })
        .limit(50)

      if (data) {
        setRankings(data)
        if (user) {
          const inList = data.findIndex((r) => r.user_id === user.id)
          if (inList >= 0) {
            setMyRank({ ...data[inList], rank: inList + 1 })
          } else {
            const { data: mine } = await supabase
              .from('prediction_rankings')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle()
            if (mine) {
              const { count } = await supabase
                .from('prediction_rankings')
                .select('*', { count: 'exact', head: true })
                .gt(orderCol, mine[orderCol])
              setMyRank({ ...mine, rank: (count || 0) + 1 })
            } else {
              setMyRank(null)
            }
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [sortBy, user])

  const medalColor = (rank) => {
    if (rank === 1) return '#FFD700'
    if (rank === 2) return '#C0C0C0'
    if (rank === 3) return '#CD7F32'
    return null
  }

  const RankRow = ({ item, rank, isMe }) => (
    <div
      className={`ball-card${isMe ? ' stitched' : ''} flex items-center gap-3`}
      style={{ padding: '12px 14px' }}
    >
      <div
        className="num"
        style={{
          width: 32, minWidth: 32, textAlign: 'center',
          fontSize: rank <= 3 ? 18 : 14,
          fontWeight: 800,
          color: medalColor(rank) || 'var(--color-ink-muted)',
        }}
      >
        {rank}
      </div>
      <TeamLogo team={{ id: item.favorite_team_id, name: item.team_name, logo_url: null }} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.nickname}
          {isMe && <span style={{ fontSize: 10, color: 'var(--color-stitch-red)', marginLeft: 6 }}>ME</span>}
        </div>
        {item.team_name && (
          <div style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600 }}>{item.team_name}</div>
        )}
      </div>
      <div className="text-right" style={{ minWidth: 70 }}>
        <div className="num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-grass-deep)' }}>
          {item.accuracy_pct}%
        </div>
        <div className="num" style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
          {item.correct}/{item.judged}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="ball-card" style={{ padding: 16, marginBottom: 12, textAlign: 'center' }}>
        <Trophy size={28} style={{ color: 'var(--color-score-yellow)', margin: '0 auto 6px' }} />
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>예측 랭킹</h1>
        <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 4, fontWeight: 600 }}>
          5경기 이상 판정된 유저만 표시돼요
        </p>
      </div>

      {/* Sort toggle */}
      <div className="flex gap-2 mb-3">
        <button
          className={`btn-ghost flex-1 ${sortBy === 'accuracy' ? 'selected' : ''}`}
          style={{ padding: '8px 12px', fontSize: 13 }}
          onClick={() => setSortBy('accuracy')}
        >
          적중률순
        </button>
        <button
          className={`btn-ghost flex-1 ${sortBy === 'correct' ? 'selected' : ''}`}
          style={{ padding: '8px 12px', fontSize: 13 }}
          onClick={() => setSortBy('correct')}
        >
          적중수순
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10" style={{ color: 'var(--color-ink-muted)' }}>투구 준비 중...</div>
      ) : rankings.length === 0 ? (
        <div className="ball-card text-center" style={{ padding: '40px 20px' }}>
          <p style={{ fontWeight: 700, color: 'var(--color-ink-muted)' }}>아직 랭킹 데이터가 없어요</p>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginTop: 4 }}>예측을 더 많이 해봐요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rankings.map((item, i) => (
            <RankRow key={item.user_id} item={item} rank={i + 1} isMe={user?.id === item.user_id} />
          ))}
        </div>
      )}

      {/* My rank (if not in top 50) */}
      {myRank && !rankings.find((r) => r.user_id === user?.id) && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-ink-muted)', marginBottom: 6, letterSpacing: '0.1em' }}>
            내 순위
          </div>
          <RankRow item={myRank} rank={myRank.rank} isMe />
        </div>
      )}

      {user && (
        <div className="text-center" style={{ marginTop: 16 }}>
          <Link to="/mypage" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-stitch-red)' }}>
            내 예측 기록 보기 &gt;
          </Link>
        </div>
      )}
    </div>
  )
}
