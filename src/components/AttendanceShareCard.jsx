const dayNamesEn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// Inline baseball SVG logo
function BaseballLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10.5" fill="#fafaf6" stroke="#14110d" strokeWidth="1.2" />
      <path d="M8 3.5C9.5 7 9.5 17 8 20.5" stroke="#c8202b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M16 3.5C14.5 7 14.5 17 16 20.5" stroke="#c8202b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function AttendanceShareCard({ game, favoriteTeamId, nickname }) {
  if (!game) return null

  const isHome = favoriteTeamId === game.home_team_id
  const myScore = isHome ? game.home_score : game.away_score
  const opScore = isHome ? game.away_score : game.home_score
  const isWin = myScore > opScore
  const isDraw = myScore === opScore

  const resultLabel = isWin ? '승' : isDraw ? '무' : '패'
  const resultBg = isWin ? '#2e6b3d' : isDraw ? '#7a7165' : '#c8202b'

  const certText = isWin ? '승요 인증 \u2713' : isDraw ? '무요 인증' : '패요 인증'
  const certColor = isWin ? '#1f4d2c' : isDraw ? '#7a7165' : '#c8202b'

  const dateObj = new Date(game.date + 'T00:00:00')
  const pad = (n) => String(n).padStart(2, '0')
  const dateStr = `${dateObj.getFullYear()}.${pad(dateObj.getMonth() + 1)}.${pad(dateObj.getDate())} ${dayNamesEn[dateObj.getDay()]}`

  const awayLogo = game.away_team?.logo_url
  const homeLogo = game.home_team?.logo_url
  const awayName = game.away_team?.name || ''
  const homeName = game.home_team?.name || ''

  const myTeamIsHome = isHome

  return (
    <div
      style={{
        width: 360,
        height: 540,
        fontFamily: "'Pretendard', -apple-system, system-ui, sans-serif",
        background: '#f1ece1',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: 32 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
          color: '#7a7165',
        }}>
          DIRECT VISIT
        </div>
        <div style={{
          fontSize: 28, fontWeight: 900, color: '#14110d',
          marginTop: 4,
        }}>
          직관 기록
        </div>
      </div>

      {/* Scoreboard area with dashed border */}
      <div style={{
        margin: '20px 24px 0',
        border: '2px dashed #c8202b',
        borderRadius: 14,
        padding: '16px 16px 14px',
        background: '#fafaf6',
        position: 'relative',
      }}>
        {/* Date */}
        <div style={{
          fontSize: 13, fontWeight: 700, color: '#3a352d',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}>
          {dateStr}
        </div>

        {/* Result badge - absolute top right */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: resultBg, color: 'white',
          fontSize: 14, fontWeight: 800,
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 6,
        }}>
          {resultLabel}
        </div>

        {/* Score display */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 14, marginTop: 16,
        }}>
          {/* Away team logo */}
          <div style={{ textAlign: 'center', width: 56 }}>
            {awayLogo ? (
              <img src={awayLogo} alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} crossOrigin="anonymous" />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: '#7a7165', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 16,
              }}>{awayName.charAt(0)}</div>
            )}
          </div>

          {/* Score */}
          <div style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 36, fontWeight: 900, color: '#14110d',
            letterSpacing: 2,
          }}>
            {game.away_score} : {game.home_score}
          </div>

          {/* Home team logo */}
          <div style={{ textAlign: 'center', width: 56 }}>
            {homeLogo ? (
              <img src={homeLogo} alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} crossOrigin="anonymous" />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: '#7a7165', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 16,
              }}>{homeName.charAt(0)}</div>
            )}
          </div>
        </div>

        {/* Team names with checkmark on user's team */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 14, marginTop: 6,
        }}>
          <div style={{ width: 56, textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3a352d' }}>
              {awayName.split(' ')[0]}
            </span>
            {!myTeamIsHome && <span style={{ color: '#c8202b', fontSize: 13, fontWeight: 800 }}> &#10003;</span>}
          </div>
          <div style={{ width: 80 }} />
          <div style={{ width: 56, textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3a352d' }}>
              {homeName.split(' ')[0]}
            </span>
            {myTeamIsHome && <span style={{ color: '#c8202b', fontSize: 13, fontWeight: 800 }}> &#10003;</span>}
          </div>
        </div>

        {/* Stadium */}
        {game.stadium && (
          <div style={{
            textAlign: 'center', marginTop: 10,
            fontSize: 12, color: '#7a7165', fontWeight: 600,
          }}>
            &#128205; {game.stadium}
          </div>
        )}
      </div>

      {/* Certification text */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <div style={{
          fontSize: 24, fontWeight: 900, color: certColor,
        }}>
          &ldquo;{certText}&rdquo;
        </div>
        <div style={{
          fontSize: 13, color: '#7a7165', fontWeight: 700, marginTop: 6,
        }}>
          {nickname}
        </div>
      </div>

      {/* Footer branding */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center',
        padding: '16px 24px',
        borderTop: '1px dashed #d6cdb8',
        gap: 6,
      }}>
        <BaseballLogo size={18} />
        <span style={{ fontSize: 14, fontWeight: 900, color: '#14110d' }}>
          메이트볼
        </span>
      </div>
    </div>
  )
}
