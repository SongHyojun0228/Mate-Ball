import { useState, useEffect } from 'react'
import { Ticket, Trophy, PartyPopper } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function Raffle() {
  const { user } = useAuthStore()
  const [activeRound, setActiveRound] = useState(null)
  const [myTicketCount, setMyTicketCount] = useState(0)
  const [latestWinners, setLatestWinners] = useState(null)
  const [pastRounds, setPastRounds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)

    const { data: round } = await supabase
      .from('raffle_rounds')
      .select('*')
      .eq('status', 'active')
      .maybeSingle()

    setActiveRound(round)

    if (round) {
      const { count } = await supabase
        .from('raffle_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('round_id', round.id)
      setMyTicketCount(count || 0)
    }

    const { data: past } = await supabase
      .from('raffle_rounds')
      .select('*, raffle_winners(*, profiles(nickname))')
      .eq('status', 'completed')
      .order('round_number', { ascending: false })
      .limit(5)

    if (past) {
      setPastRounds(past)
      const latest = past.find((r) => r.raffle_winners?.length > 0)
      if (latest) setLatestWinners(latest)
    }
    setLoading(false)
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="text-center py-10" style={{ color: 'var(--color-ink-muted)' }}>
        투구 준비 중...
      </div>
    )
  }

  return (
    <div>
      {/* Title */}
      <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
        <Ticket size={22} />
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>치킨 추첨</h2>
      </div>

      {/* Big ticket card with perforation */}
      {activeRound ? (
        <div className="ball-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
          {/* Green scoreboard top */}
          <div style={{
            background: 'linear-gradient(180deg, #1f4329 0%, #14301c 100%)',
            padding: '16px 18px', color: 'white', position: 'relative',
          }}>
            <div className="flex justify-between items-start">
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em',
                }}>
                  ROUND {String(activeRound.round_number).padStart(2, '0')} · 진행중
                </div>
                <div className="num" style={{
                  fontSize: 28, fontWeight: 800, marginTop: 4,
                  color: 'var(--color-score-yellow)',
                  textShadow: '0 0 10px rgba(255,200,80,0.4)',
                }}>
                  {activeRound.prize}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
                  {formatDate(activeRound.start_date)} → {formatDate(activeRound.end_date)} · 매주 {activeRound.winner_count}명 추첨
                </div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: '1.5px dashed rgba(255,215,107,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-score-yellow)',
              }}>
                <Ticket size={20} />
              </div>
            </div>
          </div>

          {/* Ticket perforation */}
          <div style={{ height: 0, position: 'relative', borderTop: '1.5px dashed var(--color-line)' }}>
            <div style={{
              position: 'absolute', left: -8, top: -8,
              width: 16, height: 16, borderRadius: '50%',
              background: 'var(--color-ball-cream)',
            }} />
            <div style={{
              position: 'absolute', right: -8, top: -8,
              width: 16, height: 16, borderRadius: '50%',
              background: 'var(--color-ball-cream)',
            }} />
          </div>

          {/* Ticket count */}
          <div style={{ padding: '20px 18px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-muted)', letterSpacing: '0.1em' }}>
              내 응모권
            </div>
            <div className="num" style={{
              fontSize: 56, fontWeight: 800,
              color: 'var(--color-stitch-red)', lineHeight: 1, margin: '6px 0',
            }}>
              {myTicketCount}<span style={{ fontSize: 28, marginLeft: 4 }}>장</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', fontWeight: 600 }}>
              승부예측 적중하면 응모권을 받아요!
            </div>
          </div>
        </div>
      ) : (
        <div className="ball-card text-center" style={{ padding: '32px 20px', marginBottom: 12 }}>
          <p style={{ color: 'var(--color-ink-muted)', fontWeight: 700 }}>현재 진행 중인 라운드가 없어요</p>
        </div>
      )}

      {/* 최근 당첨자 하이라이트 */}
      {latestWinners && (
        <div className="ball-card" style={{ padding: 16, marginBottom: 12, textAlign: 'center' }}>
          <div className="flex items-center justify-center gap-1.5" style={{ marginBottom: 10 }}>
            <PartyPopper size={16} style={{ color: 'var(--color-score-yellow)' }} />
            <span style={{ fontWeight: 800, fontSize: 14 }}>
              제{latestWinners.round_number}라운드 당첨자
            </span>
          </div>
          <div style={{
            fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600, marginBottom: 10,
          }}>
            {formatDate(latestWinners.start_date)} ~ {formatDate(latestWinners.end_date)}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {latestWinners.raffle_winners.map((w) => (
              <span
                key={w.id}
                style={{
                  background: 'var(--color-grass-deep)', color: 'white',
                  padding: '5px 12px', borderRadius: 999,
                  fontSize: 13, fontWeight: 800,
                }}
              >
                {w.profiles?.nickname}
              </span>
            ))}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600, marginTop: 10,
          }}>
            축하합니다! {latestWinners.prize} 당첨!
          </div>
        </div>
      )}

      {/* 응모권 얻는 방법 */}
      <div className="ball-card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>응모권 얻는 방법</div>
        <div className="flex flex-col gap-2.5">
          {[
            ['1', '승부예측 적중 시 경기당 응모권 1장'],
            ['2', '매주 라운드 종료 후 자동 추첨'],
            ['3', '당첨자는 야메 공지로 안내'],
          ].map(([n, t]) => (
            <div key={n} className="flex gap-2.5 items-start">
              <div className="num" style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--color-stitch-red)', color: 'white',
                fontWeight: 800, fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {n}
              </div>
              <div style={{ fontSize: 13, paddingTop: 2 }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{
          background: 'var(--color-ball-cream)', borderRadius: 8,
          padding: '8px 12px', marginTop: 12,
          fontSize: 12, color: 'var(--color-ink-soft)',
          textAlign: 'center', fontWeight: 600,
        }}>
          공익 기간 중 모든 기능 무료! 무료 유저도 추첨 참여 가능
        </div>
      </div>

      {/* 지난 라운드 당첨자 */}
      {pastRounds.length > 0 && (
        <div className="ball-card" style={{ padding: 16 }}>
          <div className="flex items-center gap-1.5" style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
            <Trophy size={16} style={{ color: 'var(--color-grass-mid)' }} />
            지난 당첨자
          </div>
          <div className="flex flex-col gap-4">
            {pastRounds.map((round) => (
              <div key={round.id}>
                <p style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 700, marginBottom: 6, letterSpacing: '0.02em' }}>
                  제{round.round_number}라운드 ({formatDate(round.start_date)} ~ {formatDate(round.end_date)})
                </p>
                {round.raffle_winners?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {round.raffle_winners.map((w) => (
                      <span
                        key={w.id}
                        className="badge badge-hit"
                        style={{ fontSize: 11, fontWeight: 700 }}
                      >
                        {w.profiles?.nickname}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>당첨자 정보 없음</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
