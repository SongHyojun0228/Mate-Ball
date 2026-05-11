import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import MatchChat from '../components/MatchChat'
import RatingModal from '../components/RatingModal'

export default function Messages() {
  const { user } = useAuthStore()
  const [chatRooms, setChatRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChatRequestId, setActiveChatRequestId] = useState(null)
  const [ratingTarget, setRatingTarget] = useState(null)

  useEffect(() => {
    if (!user) return
    loadChatRooms()
  }, [user])

  const loadChatRooms = async () => {
    setLoading(true)

    const [resA, resB] = await Promise.all([
      supabase
        .from('match_requests')
        .select(`
          id, created_at,
          match_posts(
            user_id,
            profiles(nickname),
            games(id, date, time, status,
              home_team:teams!games_home_team_id_fkey(name),
              away_team:teams!games_away_team_id_fkey(name)
            )
          )
        `)
        .eq('requester_id', user.id)
        .eq('status', 'accepted'),

      supabase
        .from('match_requests')
        .select(`
          id, created_at, requester_id,
          profiles:requester_id(nickname),
          match_posts!inner(
            user_id,
            games(id, date, time, status,
              home_team:teams!games_home_team_id_fkey(name),
              away_team:teams!games_away_team_id_fkey(name)
            )
          )
        `)
        .eq('match_posts.user_id', user.id)
        .eq('status', 'accepted'),
    ])

    const asRequester = resA.data || []
    const asOwner = resB.data || []

    const roomMap = new Map()

    for (const req of asRequester) {
      if (roomMap.has(req.id)) continue
      roomMap.set(req.id, {
        requestId: req.id,
        createdAt: req.created_at,
        otherNickname: req.match_posts?.profiles?.nickname || '알 수 없음',
        otherUserId: req.match_posts?.user_id || null,
        game: req.match_posts?.games || null,
      })
    }

    for (const req of asOwner) {
      if (roomMap.has(req.id)) continue
      roomMap.set(req.id, {
        requestId: req.id,
        createdAt: req.created_at,
        otherNickname: req.profiles?.nickname || '알 수 없음',
        otherUserId: req.requester_id || null,
        game: req.match_posts?.games || null,
      })
    }

    const rooms = Array.from(roomMap.values())
    const allRequestIds = rooms.map((r) => r.requestId)

    let lastMessageMap = {}
    let ratedSet = new Set()

    if (allRequestIds.length > 0) {
      const [msgRes, ratingRes] = await Promise.all([
        supabase
          .from('match_messages')
          .select('request_id, content, sender_id, created_at')
          .in('request_id', allRequestIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('ratings')
          .select('match_request_id')
          .eq('rater_id', user.id)
          .in('match_request_id', allRequestIds),
      ])

      if (msgRes.data) {
        for (const msg of msgRes.data) {
          if (!lastMessageMap[msg.request_id]) {
            lastMessageMap[msg.request_id] = msg
          }
        }
      }

      if (ratingRes.data) {
        ratedSet = new Set(ratingRes.data.map((r) => r.match_request_id))
      }
    }

    const enriched = rooms.map((room) => {
      const lastMsg = lastMessageMap[room.requestId] || null
      return {
        ...room,
        hasRated: ratedSet.has(room.requestId),
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              createdAt: lastMsg.created_at,
              isMe: lastMsg.sender_id === user.id,
            }
          : null,
        sortKey: lastMsg ? lastMsg.created_at : room.createdAt,
      }
    })

    enriched.sort((a, b) => new Date(b.sortKey) - new Date(a.sortKey))
    setChatRooms(enriched)
    setLoading(false)
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()

    if (isToday) {
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
  }

  const truncate = (str, max = 50) => {
    if (!str) return ''
    return str.length > max ? str.slice(0, max) + '...' : str
  }

  const handleCloseChat = () => {
    setActiveChatRequestId(null)
    loadChatRooms()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>쪽지함</h2>
        {!loading && chatRooms.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
            {chatRooms.length}개 대화
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-center py-6" style={{ color: 'var(--color-ink-muted)' }}>투구 준비 중...</p>
      ) : chatRooms.length === 0 ? (
        <div className="ball-card text-center" style={{ padding: '32px 20px' }}>
          <MessageCircle size={36} style={{ color: 'var(--color-line)', margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--color-ink-muted)', fontWeight: 700, fontSize: 14 }}>아직 매칭된 대화가 없어요</p>
          <Link to="/" style={{ color: 'var(--color-stitch-red)', fontSize: 13, fontWeight: 700 }}>
            경기방에서 직관 동행을 구해봐요!
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {chatRooms.map((room) => (
            <div key={room.requestId} className="ball-card" style={{ padding: 14 }}>
              <button
                onClick={() => setActiveChatRequestId(room.requestId)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                <div className="flex justify-between items-start" style={{ marginBottom: 4 }}>
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{room.otherNickname}</span>
                  </div>
                  {room.lastMessage && (
                    <span style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
                      {formatTime(room.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                {room.game && (
                  <p style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600, marginBottom: 4 }}>
                    {room.game.home_team?.name} vs {room.game.away_team?.name} · {room.game.date}
                  </p>
                )}
                {room.lastMessage ? (
                  <p style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>
                    {room.lastMessage.isMe ? '나: ' : ''}
                    {truncate(room.lastMessage.content)}
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                    아직 메시지가 없어요
                  </p>
                )}
              </button>

              {/* 평점 영역 */}
              {room.game?.status === 'finished' && (
                <div style={{
                  marginTop: 8, paddingTop: 8,
                  borderTop: '1px dashed var(--color-line)',
                }}>
                  {room.hasRated ? (
                    <span className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--color-grass-mid)', fontWeight: 700 }}>
                      <Star size={12} fill="currentColor" stroke="currentColor" />
                      평점 완료
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setRatingTarget({
                          requestId: room.requestId,
                          ratedUserId: room.otherUserId,
                          ratedNickname: room.otherNickname,
                        })
                      }}
                      className="flex items-center gap-1"
                      style={{
                        background: 'rgba(200,32,43,0.08)', color: 'var(--color-stitch-red)',
                        fontSize: 11, fontWeight: 800,
                        padding: '5px 10px', borderRadius: 6,
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      <Star size={12} />
                      매너 평점 남기기
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeChatRequestId && (
        <MatchChat
          requestId={activeChatRequestId}
          onClose={handleCloseChat}
        />
      )}

      {ratingTarget && (
        <RatingModal
          requestId={ratingTarget.requestId}
          ratedUserId={ratingTarget.ratedUserId}
          ratedNickname={ratingTarget.ratedNickname}
          onClose={() => setRatingTarget(null)}
          onRated={loadChatRooms}
        />
      )}
    </div>
  )
}
