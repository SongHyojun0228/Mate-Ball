import { useState } from 'react'
import { ChevronDown, ChevronUp, Camera, Trash2, Share2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TeamLogo from './TeamLogo'
import PhotoUpload from './PhotoUpload'
import AttendanceShareCard from './AttendanceShareCard'
import SharePreviewModal from './SharePreviewModal'

export default function AttendanceCard({ record, favoriteTeamId, onDelete, onUpdate, nickname, seasonWins, seasonLosses }) {
  const [expanded, setExpanded] = useState(false)
  const [memo, setMemo] = useState(record.memo || '')
  const [editingMemo, setEditingMemo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const game = record.games
  if (!game) return null

  const isHomeTeam = favoriteTeamId === game.home_team_id
  const myScore = isHomeTeam ? game.home_score : game.away_score
  const opponentScore = isHomeTeam ? game.away_score : game.home_score

  let result, resultBadge
  if (myScore > opponentScore) {
    result = '승'
    resultBadge = { background: 'var(--color-grass-mid)', color: 'white' }
  } else if (myScore < opponentScore) {
    result = '패'
    resultBadge = { background: 'var(--color-stitch-red)', color: 'white' }
  } else {
    result = '무'
    resultBadge = { background: 'var(--color-ink-muted)', color: 'white' }
  }

  const dateObj = new Date(game.date)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dateStr = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 (${dayNames[dateObj.getDay()]})`

  const photos = record.attendance_photos || []

  const handleSaveMemo = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('attendance_records')
      .update({ memo: memo || null })
      .eq('id', record.id)

    if (!error) {
      setEditingMemo(false)
      onUpdate?.({ ...record, memo })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('직관 기록을 삭제할까요?')) return

    if (photos.length > 0) {
      const paths = photos.map((p) => p.storage_path)
      await supabase.storage.from('attendance-photos').remove(paths)
    }

    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', record.id)

    if (!error) onDelete?.(record.id)
  }

  const handlePhotosChange = (newPhotos) => {
    onUpdate?.({ ...record, attendance_photos: newPhotos })
  }

  return (
    <div className="ball-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Card header (clickable) */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', padding: 14, cursor: 'pointer',
          background: 'none', border: 'none', textAlign: 'left',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontWeight: 700 }}>{dateStr}</span>
            <span className="badge" style={{ ...resultBadge, fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 4 }}>
              {result}
            </span>
            <span style={{
              background: record.source === 'match' ? 'var(--color-grass-mid)' : 'var(--color-ball-cream)',
              color: record.source === 'match' ? 'white' : 'var(--color-ink-soft)',
              fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
            }}>
              {record.source === 'match' ? '매칭' : '직접'}
            </span>
          </div>
          {expanded ? (
            <ChevronUp size={14} style={{ color: 'var(--color-ink-muted)' }} />
          ) : (
            <ChevronDown size={14} style={{ color: 'var(--color-ink-muted)' }} />
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <TeamLogo team={game.away_team} size={28} />
          <span style={{ fontSize: 13, fontWeight: 800 }}>{game.away_team?.name}</span>
          <span className="num" style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-stitch-red)' }}>
            {game.away_score} : {game.home_score}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800 }}>{game.home_team?.name}</span>
          <TeamLogo team={game.home_team} size={28} />
        </div>
      </button>

      {/* Expanded section */}
      {expanded && (
        <div style={{
          borderTop: '1px dashed var(--color-line)',
          padding: '12px 14px',
        }} className="flex flex-col gap-2.5">
          {/* Photos */}
          <PhotoUpload
            attendanceId={record.id}
            photos={photos}
            onPhotosChange={handlePhotosChange}
          />

          {/* Memo */}
          <div>
            {editingMemo ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  maxLength={200}
                  placeholder="직관 메모 (최대 200자)"
                  className="field-input"
                  style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
                />
                <button
                  onClick={handleSaveMemo}
                  disabled={saving}
                  className="btn-stitch"
                  style={{ padding: '6px 12px', fontSize: 11 }}
                >
                  {saving ? '...' : '저장'}
                </button>
                <button
                  onClick={() => { setEditingMemo(false); setMemo(record.memo || '') }}
                  className="btn-ghost"
                  style={{ padding: '6px 10px', fontSize: 11 }}
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingMemo(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: record.memo ? 'var(--color-ink-soft)' : 'var(--color-ink-muted)',
                }}
              >
                {record.memo || '메모 추가...'}
              </button>
            )}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--color-stitch-red)',
                fontWeight: 700,
              }}
            >
              <Share2 size={13} />
              공유 카드 만들기
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--color-ink-muted)',
              }}
            >
              <Trash2 size={13} />
              기록 삭제
            </button>
          </div>
        </div>
      )}

      {/* Share preview modal */}
      <SharePreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        cardWidth={360}
        cardHeight={640}
        filename="mateball_직관.png"
        renderCard={() => (
          <AttendanceShareCard
            game={game}
            favoriteTeamId={favoriteTeamId}
            nickname={nickname}
            memo={record.memo}
            seasonWins={seasonWins}
            seasonLosses={seasonLosses}
          />
        )}
        cardData={{
          type: 'attendance',
          date: game.date,
          awayTeamId: game.away_team?.id,
          awayTeamName: game.away_team?.name,
          homeTeamId: game.home_team?.id,
          homeTeamName: game.home_team?.name,
          awayScore: game.away_score,
          homeScore: game.home_score,
          stadium: game.stadium,
          favoriteTeamId,
          memo: record.memo,
          seasonWins,
          seasonLosses,
        }}
      />
    </div>
  )
}
