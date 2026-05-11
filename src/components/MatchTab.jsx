import { useState, useEffect } from 'react'
import { Users, Plus, X, Check, XCircle, MessageCircle, Star, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import MatchChat from './MatchChat'

export default function MatchTab({ game, isMyGame }) {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    seat_area: '미정',
    gender_pref: '무관',
    group_size: '1:1',
    description: '',
  })

  // 메시징 관련 state
  const [requestingPostId, setRequestingPostId] = useState(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [activeChatRequestId, setActiveChatRequestId] = useState(null)
  const [myAcceptedRequests, setMyAcceptedRequests] = useState([])

  useEffect(() => {
    loadPosts()
    loadMyAcceptedRequests()
  }, [game.id])

  const loadPosts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('match_posts')
      .select('*, profiles(nickname, favorite_team_id, rating_avg, no_show_count), match_requests(*, profiles(nickname, no_show_count))')
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })
    if (data) setPosts(data)
    setLoading(false)
  }

  const loadMyAcceptedRequests = async () => {
    if (!user) return
    const { data } = await supabase
      .from('match_requests')
      .select('*, match_posts!inner(game_id, user_id, profiles(nickname))')
      .eq('requester_id', user.id)
      .eq('status', 'accepted')
      .eq('match_posts.game_id', game.id)
    if (data) setMyAcceptedRequests(data)
  }

  const handleNoShowReport = async (requestId) => {
    if (!confirm('상대방이 나타나지 않았나요? 노쇼 신고를 하시겠습니까?')) return
    const { error } = await supabase
      .from('match_requests')
      .update({ no_show_reported_by: user.id })
      .eq('id', requestId)
    if (error) {
      alert('신고 처리 중 오류가 발생했어요.')
    } else {
      await loadPosts()
      await loadMyAcceptedRequests()
    }
  }

  const handleSubmitPost = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.from('match_posts').insert({
      user_id: user.id,
      game_id: game.id,
      ...form,
    })

    if (error) {
      alert('파울볼! 다시 시도해봐요.')
    } else {
      setShowForm(false)
      setForm({ seat_area: '미정', gender_pref: '무관', group_size: '1:1', description: '' })
      await loadPosts()
    }
    setSubmitting(false)
  }

  const handleRequestMatch = async (postId) => {
    const { error } = await supabase.from('match_requests').insert({
      post_id: postId,
      requester_id: user.id,
      message: requestMessage.trim() || null,
    })

    if (error) {
      if (error.message?.includes('duplicate')) {
        alert('이미 신청했어요!')
      } else {
        alert('파울볼! 다시 시도해봐요.')
      }
    } else {
      setRequestingPostId(null)
      setRequestMessage('')
      await loadPosts()
    }
  }

  const handleRequestAction = async (requestId, action) => {
    const { error } = await supabase
      .from('match_requests')
      .update({ status: action })
      .eq('id', requestId)

    if (!error) {
      await loadPosts()
      await loadMyAcceptedRequests()
    }
  }

  if (loading) {
    return <p className="text-center py-6" style={{ color: 'var(--color-ink-muted)' }}>투구 준비 중...</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 내가 신청해서 수락된 매칭 배너 */}
      {myAcceptedRequests.map((req) => (
        <div
          key={req.id}
          className="ball-card flex items-center justify-between"
          style={{
            padding: 14,
            border: '1.5px solid var(--color-grass-mid)',
            background: 'rgba(46,107,61,0.06)',
          }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-grass-mid)' }}>매칭 성공!</p>
            <p style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600, marginTop: 2 }}>
              {req.match_posts?.profiles?.nickname}님과 매칭되었어요
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {game.status === 'finished' && !req.no_show_reported_by && (
              <button
                onClick={() => handleNoShowReport(req.id)}
                className="flex items-center gap-1"
                style={{
                  background: 'rgba(200,32,43,0.08)', color: 'var(--color-stitch-red)',
                  fontSize: 10, fontWeight: 800,
                  padding: '6px 8px', borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                }}
              >
                <AlertTriangle size={11} />
                안 나왔어요
              </button>
            )}
            {game.status === 'finished' && req.no_show_reported_by && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                신고완료
              </span>
            )}
            <button
              onClick={() => setActiveChatRequestId(req.id)}
              className="flex items-center gap-1"
              style={{
                background: 'var(--color-grass-mid)', color: 'white',
                fontSize: 11, fontWeight: 800,
                padding: '6px 10px', borderRadius: 8,
                border: 'none', cursor: 'pointer',
              }}
            >
              <MessageCircle size={13} />
              대화하기
            </button>
          </div>
        </div>
      ))}

      {/* 글 작성 버튼 */}
      {isMyGame ? (
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-ghost flex items-center justify-center gap-2"
          style={{
            width: '100%', borderStyle: 'dashed',
            borderColor: 'var(--color-stitch-red)', color: 'var(--color-stitch-red)',
            padding: 16,
          }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? '취소' : '직관 동행 구하기'}
        </button>
      ) : (
        <div className="ball-card text-center" style={{ padding: '12px 16px' }}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
            내 응원팀 경기에서만 직관 매칭을 이용할 수 있어요
          </p>
        </div>
      )}

      {/* 작성 폼 */}
      {showForm && (
        <form onSubmit={handleSubmitPost} className="ball-card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-ink-muted)', marginBottom: 6, letterSpacing: '0.05em' }}>
              좌석 구역
            </label>
            <div className="flex gap-2">
              {['1루', '3루', '외야', '미정'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm({ ...form, seat_area: v })}
                  className={`btn-ghost flex-1${form.seat_area === v ? ' selected' : ''}`}
                  style={{ padding: '8px 6px', fontSize: 12 }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-ink-muted)', marginBottom: 6, letterSpacing: '0.05em' }}>
                선호 성별
              </label>
              <div className="flex gap-2">
                {['무관', '동성만'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, gender_pref: v })}
                    className={`btn-ghost flex-1${form.gender_pref === v ? ' selected' : ''}`}
                    style={{ padding: '8px 6px', fontSize: 12 }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-ink-muted)', marginBottom: 6, letterSpacing: '0.05em' }}>
                모집 인원
              </label>
              <div className="flex gap-2">
                {['1:1', '단체'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, group_size: v })}
                    className={`btn-ghost flex-1${form.group_size === v ? ' selected' : ''}`}
                    style={{ padding: '8px 6px', fontSize: 12 }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="한 줄 소개 (같이 치맥할 사람!)"
            maxLength={100}
            className="field-input"
            style={{ marginBottom: 12 }}
          />

          <button type="submit" disabled={submitting} className="btn-stitch">
            {submitting ? '투구 중...' : '직관 가자!'}
          </button>
        </form>
      )}

      {/* 매칭 글 목록 */}
      {posts.length === 0 ? (
        <div className="ball-card text-center" style={{ padding: '32px 20px' }}>
          <Users size={36} style={{ color: 'var(--color-line)', margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: 14 }}>아직 직관 동행 글이 없어요</p>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 12, marginTop: 2 }}>첫 번째로 올려봐요!</p>
        </div>
      ) : (
        posts.map((post) => {
          const isOwner = post.user_id === user?.id
          const myRequest = post.match_requests?.find(
            (r) => r.requester_id === user?.id
          )
          const alreadyRequested = !!myRequest
          const isRequesting = requestingPostId === post.id

          return (
            <div key={post.id} className="ball-card" style={{ padding: 14 }}>
              <div className="flex justify-between items-start" style={{ marginBottom: 8 }}>
                <div className="flex items-center gap-1.5">
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{post.profiles?.nickname}</span>
                  {post.profiles?.rating_avg > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star size={12} fill="var(--color-stitch-red)" stroke="var(--color-stitch-red)" />
                      <span className="num" style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-stitch-red)' }}>
                        {post.profiles.rating_avg}
                      </span>
                    </span>
                  )}
                  {post.profiles?.no_show_count > 0 && (
                    <span className="flex items-center gap-0.5" style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-stitch-red)' }}>
                      <AlertTriangle size={10} />
                      노쇼 {post.profiles.no_show_count}회
                    </span>
                  )}
                </div>
                <span className={`badge ${post.status === 'open' ? 'badge-scheduled' : 'badge-final'}`}>
                  {post.status === 'open' ? '모집중' : post.status === 'matched' ? '매칭완료' : '마감'}
                </span>
              </div>

              {/* Chalk pills */}
              <div className="flex gap-1.5" style={{ marginBottom: 8 }}>
                {[post.seat_area, post.gender_pref, post.group_size].map((x) => (
                  <span key={x} style={{
                    background: 'var(--color-ball-cream)', padding: '3px 8px',
                    borderRadius: 4, fontSize: 11, fontWeight: 700, color: 'var(--color-ink-soft)',
                  }}>
                    {x}
                  </span>
                ))}
              </div>

              {post.description && (
                <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 10 }}>{post.description}</p>
              )}

              {/* 신청 버튼 / 인라인 신청 폼 */}
              {!isOwner && isMyGame && post.status === 'open' && !alreadyRequested && (
                isRequesting ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="한마디 남기기 (선택, 100자)"
                      maxLength={100}
                      className="field-input"
                      style={{ fontSize: 12 }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequestMatch(post.id)}
                        className="btn-stitch flex-1"
                        style={{ padding: '8px 12px', fontSize: 12 }}
                      >
                        신청 보내기
                      </button>
                      <button
                        onClick={() => {
                          setRequestingPostId(null)
                          setRequestMessage('')
                        }}
                        className="btn-ghost"
                        style={{ padding: '8px 16px', fontSize: 12 }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setRequestingPostId(post.id)}
                    className="btn-stitch"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                  >
                    같이 가자!
                  </button>
                )
              )}

              {/* 이미 신청한 경우 — 상태별 표시 */}
              {!isOwner && alreadyRequested && myRequest.status === 'pending' && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8, textAlign: 'center',
                  background: 'var(--color-line-soft)', color: 'var(--color-ink-muted)',
                  fontSize: 12, fontWeight: 700,
                }}>
                  대기중...
                </div>
              )}

              {!isOwner && alreadyRequested && myRequest.status === 'accepted' && (
                <div className="flex items-center gap-2" style={{
                  background: 'rgba(46,107,61,0.06)', border: '1px solid rgba(46,107,61,0.2)',
                  borderRadius: 8, padding: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-grass-mid)' }}>수락되었어요!</p>
                    <p style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 2 }}>
                      {post.profiles?.nickname}님과 직관 가요
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ flexShrink: 0 }}>
                    {game.status === 'finished' && !myRequest.no_show_reported_by && (
                      <button
                        onClick={() => handleNoShowReport(myRequest.id)}
                        className="flex items-center gap-1"
                        style={{
                          background: 'rgba(200,32,43,0.08)', color: 'var(--color-stitch-red)',
                          fontSize: 10, fontWeight: 800,
                          padding: '6px 8px', borderRadius: 8,
                          border: 'none', cursor: 'pointer',
                        }}
                      >
                        <AlertTriangle size={11} />
                        안 나왔어요
                      </button>
                    )}
                    {game.status === 'finished' && myRequest.no_show_reported_by && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                        신고완료
                      </span>
                    )}
                    <button
                      onClick={() => setActiveChatRequestId(myRequest.id)}
                      className="flex items-center gap-1"
                      style={{
                        background: 'var(--color-grass-mid)', color: 'white',
                        fontSize: 11, fontWeight: 800,
                        padding: '6px 10px', borderRadius: 8,
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      <MessageCircle size={13} />
                      대화하기
                    </button>
                  </div>
                </div>
              )}

              {!isOwner && alreadyRequested && myRequest.status === 'rejected' && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8, textAlign: 'center',
                  background: 'rgba(200,32,43,0.05)', border: '1px solid rgba(200,32,43,0.1)',
                  color: 'rgba(200,32,43,0.6)', fontSize: 12, fontWeight: 700,
                }}>
                  아쉽지만 다음 기회에!
                </div>
              )}

              {/* 내 글의 신청 목록 */}
              {isOwner && post.match_requests?.length > 0 && (
                <div style={{ marginTop: 10, borderTop: '1px dashed var(--color-line)', paddingTop: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-ink-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>
                    신청 {post.match_requests.length}건
                  </p>
                  {post.match_requests.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        padding: '8px 0',
                        borderBottom: '1px solid var(--color-line-soft)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{req.profiles?.nickname}</span>
                          {req.profiles?.no_show_count > 0 && (
                            <span className="flex items-center gap-0.5" style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-stitch-red)' }}>
                              <AlertTriangle size={10} />
                              노쇼 {req.profiles.no_show_count}회
                            </span>
                          )}
                        </div>
                        {req.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRequestAction(req.id, 'accepted')}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--color-grass-mid)', padding: 4, borderRadius: 4,
                              }}
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleRequestAction(req.id, 'rejected')}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--color-stitch-red)', padding: 4, borderRadius: 4,
                              }}
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ) : req.status === 'accepted' ? (
                          <div className="flex items-center gap-1.5">
                            {game.status === 'finished' && !req.no_show_reported_by && (
                              <button
                                onClick={() => handleNoShowReport(req.id)}
                                className="flex items-center gap-1"
                                style={{
                                  background: 'rgba(200,32,43,0.08)', color: 'var(--color-stitch-red)',
                                  fontSize: 10, fontWeight: 800,
                                  padding: '4px 8px', borderRadius: 6,
                                  border: 'none', cursor: 'pointer',
                                }}
                              >
                                <AlertTriangle size={10} />
                                안 나왔어요
                              </button>
                            )}
                            {game.status === 'finished' && req.no_show_reported_by && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                                신고완료
                              </span>
                            )}
                            <button
                              onClick={() => setActiveChatRequestId(req.id)}
                              className="flex items-center gap-1"
                              style={{
                                background: 'rgba(46,107,61,0.1)', color: 'var(--color-grass-mid)',
                                fontSize: 11, fontWeight: 800,
                                padding: '4px 10px', borderRadius: 6,
                                border: 'none', cursor: 'pointer',
                              }}
                            >
                              <MessageCircle size={12} />
                              대화하기
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-muted)' }}>거절됨</span>
                        )}
                      </div>
                      {req.message && (
                        <p style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 4, paddingLeft: 2 }}>
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}

      {/* MatchChat 모달 */}
      {activeChatRequestId && (
        <MatchChat
          requestId={activeChatRequestId}
          onClose={() => setActiveChatRequestId(null)}
        />
      )}
    </div>
  )
}
