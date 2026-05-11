import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import TeamLogo from './TeamLogo'

export default function GameCard({ game, hasPredicted }) {
  const profile = useAuthStore((s) => s.profile)
  const isMyGame =
    profile?.favorite_team_id === game.home_team_id ||
    profile?.favorite_team_id === game.away_team_id

  const isLive = game.status === 'live'
  const isFinished = game.status === 'finished'
  const isCancelled = game.status === 'cancelled'
  const showScore = isLive || isFinished

  return (
    <Link
      to={`/games/${game.id}`}
      className="ball-card block no-underline"
      style={{
        padding: 14, cursor: 'pointer',
        opacity: isCancelled ? 0.65 : 1,
        color: 'var(--color-ink)',
      }}
    >
      {/* Top row: badge + stadium */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          {isLive && <span className="badge badge-live">LIVE</span>}
          {game.status === 'scheduled' && (
            <span className="badge badge-scheduled num" style={{ fontWeight: 700, fontSize: 12 }}>
              {game.time?.slice(0, 5)}
            </span>
          )}
          {isFinished && <span className="badge badge-final">종료</span>}
          {isCancelled && <span className="badge badge-cancelled">취소</span>}
          {isMyGame && (
            <span className="badge" style={{
              background: 'var(--color-ink)', color: 'white',
              fontSize: 10, letterSpacing: '0.05em',
            }}>
              MY GAME
            </span>
          )}
          {game.status === 'scheduled' && hasPredicted === false && (
            <span className="badge" style={{
              background: 'var(--color-stitch-red)', color: 'white',
              fontSize: 10, letterSpacing: '0.05em',
            }}>
              <span style={{
                width: 6, height: 6, background: 'white',
                borderRadius: '50%', display: 'inline-block',
                animation: 'livepulse 1s infinite',
              }} />
              예측 가능
            </span>
          )}
        </div>
        {game.stadium && (
          <span className="flex items-center gap-1 text-ink-muted" style={{ fontSize: 11, fontWeight: 600 }}>
            <MapPin size={11} />
            {game.stadium}
          </span>
        )}
      </div>

      {/* Teams + Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
        {/* Away */}
        <div className="flex flex-col items-center gap-1.5">
          <TeamLogo team={game.away_team} size={44} />
          <span style={{ fontSize: 13, fontWeight: 800 }}>{game.away_team?.name}</span>
          <span style={{ fontSize: 10, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
            원정{game.away_pitcher ? ` · ${game.away_pitcher}` : ''}
          </span>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center" style={{ minWidth: 80 }}>
          {showScore ? (
            <div className="scoreboard" style={{ padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="value" style={{ fontSize: 22 }}>{game.away_score}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>:</span>
              <span className="value" style={{ fontSize: 22 }}>{game.home_score}</span>
            </div>
          ) : (
            <>
              <span className="num" style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-stitch-red)' }}>VS</span>
              <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink-muted)', marginTop: 2 }}>
                {game.time?.slice(0, 5)}
              </span>
            </>
          )}
        </div>

        {/* Home */}
        <div className="flex flex-col items-center gap-1.5">
          <TeamLogo team={game.home_team} size={44} />
          <span style={{ fontSize: 13, fontWeight: 800 }}>{game.home_team?.name}</span>
          <span style={{ fontSize: 10, color: 'var(--color-ink-muted)', fontWeight: 600 }}>
            홈{game.home_pitcher ? ` · ${game.home_pitcher}` : ''}
          </span>
        </div>
      </div>
    </Link>
  )
}
