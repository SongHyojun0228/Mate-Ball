import { useState, useEffect } from 'react'
import { TrendingUp, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function PredictionTab({ game }) {
  const { user } = useAuthStore()
  const [prediction, setPrediction] = useState('')
  const [reason, setReason] = useState('')
  const [myPrediction, setMyPrediction] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canPredict = game.status === 'scheduled'

  useEffect(() => {
    loadPredictions()
  }, [game.id])

  const loadPredictions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('predictions')
      .select('*, profiles(nickname, favorite_team_id)')
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })

    if (data) {
      setPredictions(data)
      const mine = data.find((p) => p.user_id === user?.id)
      if (mine) setMyPrediction(mine)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prediction) return
    setSubmitting(true)

    const { error } = await supabase.from('predictions').insert({
      user_id: user.id,
      game_id: game.id,
      prediction,
      reason: reason || null,
    })

    if (error) {
      alert('파울볼! 다시 시도해봐요.')
    } else {
      await loadPredictions()
    }
    setSubmitting(false)
  }

  const predictionLabel = (p) => {
    if (p === 'home') return game.home_team?.name || '홈팀'
    if (p === 'away') return game.away_team?.name || '원정팀'
    return '무승부'
  }

  const predictionSub = (p) => {
    if (p === 'home') return '홈 승'
    if (p === 'away') return '원정 승'
    return ''
  }

  const homePredictions = predictions.filter((p) => p.prediction === 'home')
  const awayPredictions = predictions.filter((p) => p.prediction === 'away')
  const drawPredictions = predictions.filter((p) => p.prediction === 'draw')

  if (loading) {
    return <p className="text-center py-6" style={{ color: 'var(--color-ink-muted)' }}>투구 준비 중...</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 예측 현황 */}
      {predictions.length > 0 && (
        <div className="ball-card" style={{ padding: 16 }}>
          <div className="flex items-center gap-1.5" style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
            <TrendingUp size={16} style={{ color: 'var(--color-stitch-red)' }} />
            예측 현황
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 1fr', gap: 6 }}>
            <div className="stat-tile">
              <div className="stat-num" style={{ color: 'var(--color-stitch-red)' }}>{homePredictions.length}</div>
              <div className="stat-label">{game.home_team?.name || '홈'} 승</div>
            </div>
            <div className="stat-tile">
              <div className="stat-num">{drawPredictions.length}</div>
              <div className="stat-label">무승부</div>
            </div>
            <div className="stat-tile">
              <div className="stat-num" style={{ color: 'var(--color-grass-mid)' }}>{awayPredictions.length}</div>
              <div className="stat-label">{game.away_team?.name || '원정'} 승</div>
            </div>
          </div>
        </div>
      )}

      {/* 내 예측 / 예측 폼 */}
      {myPrediction ? (
        <div className="ball-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>내 예측</div>
          <div style={{
            background: 'var(--color-ball-cream)', borderRadius: 8, padding: 12,
          }}>
            <p style={{ fontWeight: 800, color: 'var(--color-stitch-red)', fontSize: 14 }}>
              {predictionLabel(myPrediction.prediction)}
            </p>
            {myPrediction.reason && (
              <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginTop: 4 }}>{myPrediction.reason}</p>
            )}
            {myPrediction.is_correct === true && (
              <span className="badge badge-hit" style={{ marginTop: 8, display: 'inline-flex' }}>적중!</span>
            )}
            {myPrediction.is_correct === false && (
              <span className="badge badge-miss" style={{ marginTop: 8, display: 'inline-flex' }}>아쉽!</span>
            )}
          </div>
        </div>
      ) : canPredict ? (
        <form onSubmit={handleSubmit} className="ball-card" style={{ padding: 16 }}>
          <div className="flex items-center gap-1.5" style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
            <TrendingUp size={16} />
            승부 예측
          </div>

          {/* Option buttons — btn-ghost */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 1fr', gap: 6, marginBottom: 12 }}>
            {['home', 'draw', 'away'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPrediction(option)}
                className={`btn-ghost${prediction === option ? ' selected' : ''}`}
                style={{ padding: '12px 6px', fontSize: 12 }}
              >
                <div style={{ fontWeight: 800 }}>{predictionLabel(option)}</div>
                {predictionSub(option) && (
                  <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, marginTop: 2 }}>
                    {predictionSub(option)}
                  </div>
                )}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="한 줄 예측 이유 (선택)"
            maxLength={100}
            className="field-input"
            style={{ marginBottom: 10 }}
          />

          <button
            type="submit"
            disabled={!prediction || submitting}
            className="btn-stitch"
          >
            <Send size={15} />
            {submitting ? '투구 중...' : '예측 제출'}
          </button>
        </form>
      ) : (
        <div className="ball-card text-center" style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', fontWeight: 600 }}>예측이 마감되었어요</p>
        </div>
      )}

      {/* 다른 유저 예측 이유 */}
      {predictions.filter((p) => p.reason).length > 0 && (
        <div className="ball-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>팬들의 예측</div>
          <div className="flex flex-col">
            {predictions
              .filter((p) => p.reason)
              .map((p, i, arr) => (
                <div key={p.id} style={{
                  paddingBottom: i < arr.length - 1 ? 10 : 0,
                  marginBottom: i < arr.length - 1 ? 10 : 0,
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-line-soft)' : 'none',
                }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{p.profiles?.nickname}</span>
                    <span style={{
                      background: p.prediction === 'home' ? 'rgba(200,32,43,0.1)' :
                        p.prediction === 'away' ? 'rgba(46,107,61,0.1)' : 'var(--color-ball-cream)',
                      color: p.prediction === 'home' ? 'var(--color-stitch-red)' :
                        p.prediction === 'away' ? 'var(--color-grass-mid)' : 'var(--color-ink-soft)',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    }}>
                      {predictionLabel(p.prediction)}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>{p.reason}</p>
                </div>
              ))}
          </div>
        </div>
      )}

    </div>
  )
}
