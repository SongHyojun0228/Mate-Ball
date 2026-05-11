import { useState, useEffect } from 'react'
import { Star, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function RatingModal({ requestId, ratedUserId, ratedNickname, onClose, onRated }) {
  const { user } = useAuthStore()
  const [score, setScore] = useState(0)
  const [hoverScore, setHoverScore] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [existingRating, setExistingRating] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkExisting = async () => {
      const { data } = await supabase
        .from('ratings')
        .select('*')
        .eq('rater_id', user.id)
        .eq('match_request_id', requestId)
        .maybeSingle()

      if (data) setExistingRating(data)
      setLoading(false)
    }
    checkExisting()
  }, [requestId, user.id])

  const handleSubmit = async () => {
    if (score === 0 || submitting) return
    setSubmitting(true)

    const { error } = await supabase.from('ratings').insert({
      rater_id: user.id,
      rated_id: ratedUserId,
      match_request_id: requestId,
      score,
      comment: comment.trim() || null,
    })

    if (error) {
      alert('파울볼! 다시 시도해봐요.')
    } else {
      onRated?.()
      onClose()
    }
    setSubmitting(false)
  }

  const displayScore = hoverScore || score

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', padding: 16 }}
      onClick={onClose}
    >
      <div
        className="ball-card"
        style={{ width: '100%', maxWidth: 380, padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <span style={{ fontWeight: 800, fontSize: 17 }}>직관 매너 평점</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <p className="text-center py-6" style={{ color: 'var(--color-ink-muted)' }}>투구 준비 중...</p>
        ) : existingRating ? (
          <div className="text-center" style={{ padding: '16px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 12 }}>
              {ratedNickname}님에게 평점을 남겼어요
            </p>
            <div className="flex justify-center gap-1" style={{ marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={28}
                  fill={s <= existingRating.score ? 'var(--color-stitch-red)' : 'none'}
                  stroke={s <= existingRating.score ? 'var(--color-stitch-red)' : 'var(--color-line)'}
                />
              ))}
            </div>
            {existingRating.comment && (
              <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginTop: 8 }}>
                "{existingRating.comment}"
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="text-center" style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 16 }}>
              <span style={{ fontWeight: 800, color: 'var(--color-ink)' }}>{ratedNickname}</span>님과의 직관은 어땠나요?
            </p>

            {/* Stars */}
            <div className="flex justify-center gap-2" style={{ marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setScore(s)}
                  onMouseEnter={() => setHoverScore(s)}
                  onMouseLeave={() => setHoverScore(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <Star
                    size={32}
                    fill={s <= displayScore ? 'var(--color-stitch-red)' : 'none'}
                    stroke={s <= displayScore ? 'var(--color-stitch-red)' : 'var(--color-line)'}
                  />
                </button>
              ))}
            </div>
            <p className="text-center" style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginBottom: 16 }}>
              {displayScore === 0 && '별을 눌러 평점을 남겨봐요'}
              {displayScore === 1 && '아쉬워요'}
              {displayScore === 2 && '그저 그래요'}
              {displayScore === 3 && '괜찮아요'}
              {displayScore === 4 && '좋아요!'}
              {displayScore === 5 && '최고의 직관 메이트!'}
            </p>

            {/* Comment */}
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="한 줄 후기 (선택, 100자)"
              maxLength={100}
              className="field-input"
              style={{ marginBottom: 16 }}
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={score === 0 || submitting}
              className="btn-stitch"
            >
              {submitting ? '투구 중...' : '평점 남기기'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
