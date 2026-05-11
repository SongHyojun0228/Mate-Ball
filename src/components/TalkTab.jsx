import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function TalkTab({ game }) {
  const { user, profile } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const isNearBottomRef = useRef(true)
  const profileCacheRef = useRef(new Map())

  const isFinished = game.status === 'finished' || game.status === 'cancelled'

  const getTeamBorderColor = (teamId) => {
    if (teamId === game.home_team_id) return 'var(--color-stitch-red)'
    if (teamId === game.away_team_id) return 'var(--color-grass-mid)'
    return 'var(--color-line)'
  }

  const getTeamName = (teamId) => {
    if (teamId === game.home_team_id) return game.home_team?.name
    if (teamId === game.away_team_id) return game.away_team?.name
    return null
  }

  const checkNearBottom = () => {
    const el = scrollContainerRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*, profiles(nickname, favorite_team_id)')
        .eq('game_id', game.id)
        .order('created_at', { ascending: true })
        .limit(50)

      if (data) {
        data.forEach((msg) => {
          if (msg.profiles) {
            profileCacheRef.current.set(msg.user_id, msg.profiles)
          }
        })
        setMessages(data)
      }
      setLoading(false)
    }

    loadMessages()
  }, [game.id])

  useEffect(() => {
    if (!loading) scrollToBottom()
  }, [loading])

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${game.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `game_id=eq.${game.id}`,
        },
        async (payload) => {
          const newMsg = payload.new
          let msgProfile = profileCacheRef.current.get(newMsg.user_id)
          if (!msgProfile) {
            const { data } = await supabase
              .from('profiles')
              .select('nickname, favorite_team_id')
              .eq('id', newMsg.user_id)
              .single()
            if (data) {
              msgProfile = data
              profileCacheRef.current.set(newMsg.user_id, data)
            }
          }

          setMessages((prev) => [
            ...prev,
            { ...newMsg, profiles: msgProfile || null },
          ])

          if (isNearBottomRef.current) {
            setTimeout(scrollToBottom, 50)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [game.id])

  const handleSend = async (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || sending) return

    setSending(true)
    setInput('')

    const { error } = await supabase.from('chat_messages').insert({
      game_id: game.id,
      user_id: user.id,
      content: trimmed,
    })

    if (error) {
      setInput(trimmed)
      alert('파울볼! 다시 시도해봐요.')
    }
    setSending(false)
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <p className="text-center py-6" style={{ color: 'var(--color-ink-muted)' }}>투구 준비 중...</p>
  }

  return (
    <div className="ball-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between" style={{
        padding: '10px 14px',
        borderBottom: '1px dashed var(--color-line)',
      }}>
        <div className="flex items-center gap-1.5" style={{ fontWeight: 800, fontSize: 14 }}>
          <MessageCircle size={14} />
          응원토크
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
          {messages.length}개 메시지
        </span>
      </div>

      {/* 메시지 리스트 */}
      <div
        ref={scrollContainerRef}
        onScroll={checkNearBottom}
        className="flex flex-col gap-2.5"
        style={{ height: 400, overflowY: 'auto', padding: '12px 14px' }}
      >
        {messages.length === 0 ? (
          <div className="text-center" style={{ padding: '48px 0' }}>
            <MessageCircle size={28} style={{ color: 'var(--color-line)', margin: '0 auto 6px' }} />
            <p style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>첫 응원 메시지를 남겨봐요!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const teamId = msg.profiles?.favorite_team_id
            const isMe = msg.user_id === user?.id
            return (
              <div
                key={msg.id}
                style={{
                  borderLeft: `3px solid ${getTeamBorderColor(teamId)}`,
                  paddingLeft: 10,
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 2 }}>
                  <div className="flex items-center gap-1.5">
                    <span style={{
                      fontWeight: 800, fontSize: 13,
                      color: isMe ? 'var(--color-stitch-red)' : 'var(--color-ink)',
                    }}>
                      {msg.profiles?.nickname || '익명'}
                    </span>
                    {teamId && getTeamName(teamId) && (
                      <span style={{
                        background: 'var(--color-ball-cream)',
                        padding: '1px 6px', borderRadius: 4,
                        fontSize: 10, fontWeight: 700,
                      }}>
                        {getTeamName(teamId)}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: 13 }}>{msg.content}</p>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      {isFinished ? (
        <div className="text-center" style={{
          padding: '10px 14px',
          borderTop: '1px dashed var(--color-line)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
            경기가 종료되어 채팅이 마감되었어요
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex gap-1.5" style={{
          padding: '10px 14px',
          borderTop: '1px dashed var(--color-line)',
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="응원 한마디 날려봐요!"
            maxLength={200}
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
      )}
    </div>
  )
}
