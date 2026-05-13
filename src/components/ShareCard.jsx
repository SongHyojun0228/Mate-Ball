import { teamHexColors } from '../lib/shareUtils'

function BaseballLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10.5" fill="#fafaf6" stroke="#14110d" strokeWidth="1.2" />
      <path d="M8 3.5C9.5 7 9.5 17 8 20.5" stroke="#c8202b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M16 3.5C14.5 7 14.5 17 16 20.5" stroke="#c8202b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function ShareCard({ profile, total, correct, accuracy, attendanceCount, attendanceWinRate, rankingData, isRankFirst, judgedCount, bestGame }) {
  const nickname = profile?.nickname || ''
  const teamName = profile?.teams?.name || ''
  const teamId = profile?.favorite_team_id
  const teamColor = teamHexColors[teamId] || '#1f4d2c'
  const teamLogo = profile?.teams?.logo_url || null

  // Build titles
  const titles = []
  if (isRankFirst) titles.push({ label: '예측왕', bg: '#FFD700', color: '#14110d', icon: '\u2605' })
  if (rankingData?.topPct <= 5 && judgedCount >= 10) titles.push({ label: '적중 장인', bg: '#c8202b', color: 'white', icon: '\u2605' })
  if (attendanceCount >= 10) titles.push({ label: '직관의 신', bg: '#2e6b3d', color: 'white', icon: '\u2605' })
  if (profile?.rating_avg >= 4.5) titles.push({ label: '매너 MVP', bg: '#14110d', color: 'white', icon: '\u2605' })
  else if (profile?.rating_avg >= 3.5) titles.push({ label: '매너 올스타', bg: '#c8202b', color: 'white', icon: '\u2605' })

  const year = new Date().getFullYear()

  return (
    <div
      style={{
        width: 360,
        height: 640,
        fontFamily: "'Pretendard', -apple-system, system-ui, sans-serif",
        background: '#f1ece1',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Stitch line top */}
      <div style={{
        height: 6,
        background: 'repeating-linear-gradient(90deg, #c8202b 0px, #c8202b 8px, transparent 8px, transparent 14px)',
      }} />

      {/* Header text */}
      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
          color: '#7a7165',
        }}>
          YAME &middot; {year} SEASON
        </div>
        <div style={{
          fontSize: 26, fontWeight: 900, color: '#14110d',
          marginTop: 4,
        }}>
          나의 야구 스탯
        </div>
      </div>

      {/* Avatar with stitch ring */}
      <div style={{ textAlign: 'center', marginTop: 20, position: 'relative' }}>
        {/* Dashed stitch ring */}
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          border: '2px dashed #c8202b',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: '#1f4d2c', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 30,
            border: '3px solid #14110d',
          }}>
            {nickname.charAt(0)}
          </div>
        </div>
      </div>

      {/* Nickname */}
      <div style={{
        textAlign: 'center', fontWeight: 900, fontSize: 22,
        color: '#14110d', marginTop: 10,
      }}>
        {nickname}
      </div>

      {/* Team + title inline */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginTop: 6, flexWrap: 'wrap',
      }}>
        {/* Team dot + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {teamLogo ? (
            <img src={teamLogo} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} crossOrigin="anonymous" />
          ) : (
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: teamColor }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: '#3a352d' }}>{teamName}</span>
        </div>
        {/* First title badge inline */}
        {titles.length > 0 && (
          <span style={{
            background: titles[0].bg, color: titles[0].color,
            fontSize: 11, fontWeight: 800, padding: '3px 10px',
            borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 3,
          }}>
            {titles[0].icon} {titles[0].label}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 5, margin: '18px 16px 0',
      }}>
        {[
          { label: '총예측', value: total, accent: false },
          { label: '적중', value: correct, accent: false },
          { label: '적중률', value: judgedCount > 0 ? `${accuracy}%` : '-', accent: true },
          { label: '직관', value: attendanceCount, accent: false },
          { label: '승률', value: attendanceWinRate !== null ? `${attendanceWinRate}%` : '-', accent: true },
        ].map((s) => (
          <div key={s.label} style={{
            background: '#fafaf6', border: '1px solid #d6cdb8',
            borderRadius: 10, padding: '10px 4px', textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 20, fontWeight: 800,
              color: s.accent ? '#c8202b' : '#14110d',
              lineHeight: 1.1,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: '#7a7165', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FAVORITE MOMENT */}
      {bestGame && (
        <div style={{
          margin: '16px 16px 0', padding: '12px 14px',
          background: '#fafaf6', borderRadius: 10,
          border: '1px solid #d6cdb8',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
            color: '#7a7165', marginBottom: 6,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}>
            FAVORITE MOMENT
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#14110d', lineHeight: 1.5 }}>
            &ldquo;{bestGame.dateLabel} {bestGame.awayTeam} vs {bestGame.homeTeam}
            <br />
            {bestGame.awayScore}:{bestGame.homeScore} 직관{bestGame.isWin ? '승' : '패'} &middot; {bestGame.isWin ? '승요' : '패요'} 인증&rdquo;
          </div>
        </div>
      )}

      {/* Footer branding */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BaseballLogo size={18} />
          <span style={{ fontSize: 16, fontWeight: 900, color: '#14110d' }}>메이트볼</span>
        </div>
        <div style={{ fontSize: 11, color: '#7a7165', marginTop: 3, fontWeight: 600 }}>
          야구는 같이 봐야 제맛
        </div>
      </div>
    </div>
  )
}
