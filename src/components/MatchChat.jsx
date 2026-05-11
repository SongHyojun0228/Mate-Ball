import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Send, Wifi, WifiOff, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import RatingModal from './RatingModal'

export default function MatchChat({ requestId, onClose }) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [otherNickname, setOtherNickname] = useState('')
  const [otherId, setOtherId] = useState(null)
  const [gameInfo, setGameInfo] = useState(null)
  const [gameStatus, setGameStatus] = useState(null)
  const [hasRated, setHasRated] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const isNearBottomRef = useRef(true)
  const inputRef = useRef(null)
  const channelRef = useRef(null)

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior })
    }, 30)
  }, [])

  const checkNearBottom = () => {
    const el = scrollContainerRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useEffect(() => {
    const load = async () => {
      const { data: req } = await supabase
        .from('match_requests')
        .select('requester_id, post_id, match_posts(user_id, game_id, games(status, date))')
        .eq('id', requestId)
        .single()

      if (req) {
        const theOtherId =
          req.requester_id === user.id ? req.match_posts.user_id : req.requester_id
        setOtherId(theOtherId)
        setGameStatus(req.match_posts?.games?.status || null)
        setGameInfo(req.match_posts?.games || null)

        const [profRes, ratingRes] = await Promise.all([
          supabase.from('profiles').select('nickname').eq('id', theOtherId).single(),
          supabase.from('ratings').select('id').eq('rater_id', user.id).eq('match_request_id', requestId).maybeSingle(),
        ])
        if (profRes.data) setOtherNickname(profRes.data.nickname)
        if (ratingRes.data) setHasRated(true)
      }

      const { data: msgs } = await supabase
        .from('match_messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (msgs) setMessages(msgs)
      setLoading(false)
    }

    load()
  }, [requestId, user.id])

  useEffect(() => {
    if (!loading) {
      scrollToBottom('instant')
      inputRef.current?.focus()
    }
  }, [loading, scrollToBottom])

  useEffect(() => {
    const channel = supabase
      .channel(`match_dm:${requestId}`)
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        if (payload.sender_id === user.id) return

        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev
          return [...prev, payload]
        })
        if (isNearBottomRef.current) {
          scrollToBottom()
        }
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId, user.id, scrollToBottom])

  const handleSend = async (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || sending) return

    setSending(true)
    setInput('')
    inputRef.current?.focus()

    const now = new Date().toISOString()
    const tempId = `temp-${Date.now()}`

    const tempMsg = {
      id: tempId,
      request_id: requestId,
      sender_id: user.id,
      content: trimmed,
      created_at: now,
      _optimistic: true,
    }
    setMessages((prev) => [...prev, tempMsg])
    scrollToBottom()

    const { data, error } = await supabase
      .from('match_messages')
      .insert({
        request_id: requestId,
        sender_id: user.id,
        content: trimmed,
      })
      .select()
      .single()

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setInput(trimmed)
      alert('파울볼! 다시 시도해봐요.')
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data : m))
      )
      channelRef.current?.send({
        type: 'broadcast',
        event: 'message',
        payload: data,
      })
    }
    setSending(false)
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--color-ball-cream)' }}>
      {/* Scoreboard header */}
      <div className="scoreboard-header" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: 4 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{otherNickname || '...'}</div>
          {gameInfo?.date && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              {gameInfo.date}
            </div>
          )}
        </div>
        {connected ? (
          <Wifi size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
        ) : (
          <WifiOff size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
        )}
      </div>

      {/* 경기 종료 후 평점 배너 */}
      {gameStatus === 'finished' && !hasRated && (
        <div className="flex items-center justify-between" style={{
          padding: '8px 14px',
          background: 'rgba(200,32,43,0.05)',
          borderBottom: '1px solid rgba(200,32,43,0.1)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>경기가 끝났어요! 매너 평점을 남겨봐요</p>
          <button
            onClick={() => setShowRatingModal(true)}
            className="flex items-center gap-1"
            style={{
              background: 'rgba(200,32,43,0.1)', color: 'var(--color-stitch-red)',
              fontSize: 11, fontWeight: 800,
              padding: '4px 10px', borderRadius: 6,
              border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: 8,
            }}
          >
            <Star size={12} />
            평점
          </button>
        </div>
      )}

      {/* 메시지 리스트 */}
      <div
        ref={scrollContainerRef}
        onScroll={checkNearBottom}
        className="flex-1 overflow-y-auto flex flex-col gap-2"
        style={{ padding: '16px 14px' }}
      >
        {loading ? (
          <p className="text-center py-6" style={{ color: 'var(--color-ink-muted)' }}>투구 준비 중...</p>
        ) : messages.length === 0 ? (
          <div className="text-center" style={{ padding: '48px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>첫 메시지를 보내봐요!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id
            return (
              <div
                key={msg.id}
                className="flex flex-col"
                style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}
              >
                <div className={`bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}
                  style={{ opacity: msg._optimistic ? 0.7 : 1 }}
                >
                  {msg.content}
                </div>
                <span style={{
                  fontSize: 10, color: 'var(--color-ink-muted)',
                  marginTop: 2, fontWeight: 600,
                }}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <form
        onSubmit={handleSend}
        className="flex gap-1.5 safe-area-pb"
        style={{
          padding: 10,
          background: 'var(--color-ball-white)',
          borderTop: '1px solid var(--color-line)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력해봐요"
          maxLength={500}
          className="field-input"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: 10,
            border: 'none', background: 'var(--color-stitch-red)',
            color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            opacity: input.trim() ? 1 : 0.5,
          }}
        >
          <Send size={16} />
        </button>
      </form>

      {/* 평점 모달 */}
      {showRatingModal && otherId && (
        <RatingModal
          requestId={requestId}
          ratedUserId={otherId}
          ratedNickname={otherNickname}
          onClose={() => setShowRatingModal(false)}
          onRated={() => setHasRated(true)}
        />
      )}
    </div>
  )
}
