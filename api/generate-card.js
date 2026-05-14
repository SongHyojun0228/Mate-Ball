import { ImageResponse } from '@vercel/og'

const teamHexColors = {
  KIA: '#e3242b', LG: '#a50034', SSG: '#c73a42', KT: '#000000', NC: '#1e3264',
  '두산': '#13274f', '한화': '#ff6600', '롯데': '#2563eb', '삼성': '#0066b3', '키움': '#7b2d8b',
}

const dayNamesEn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function buildAttendanceCard(d) {
  const isHome = d.favoriteTeamId === d.homeTeamId
  const myScore = isHome ? d.homeScore : d.awayScore
  const opScore = isHome ? d.awayScore : d.homeScore
  const isWin = myScore > opScore
  const isDraw = myScore === opScore
  const resultLabel = isWin ? '승' : isDraw ? '무' : '패'
  const resultBg = isWin ? '#2e6b3d' : isDraw ? '#7a7165' : '#c8202b'

  const dateObj = new Date(d.date + 'T00:00:00')
  const pad = (n) => String(n).padStart(2, '0')
  const dateStr = `${dateObj.getFullYear()}.${pad(dateObj.getMonth() + 1)}.${pad(dateObj.getDate())} ${dayNamesEn[dateObj.getDay()]}`

  const awayName = d.awayTeamName || ''
  const homeName = d.homeTeamName || ''
  const awayColor = teamHexColors[d.awayTeamId] || '#7a7165'
  const homeColor = teamHexColors[d.homeTeamId] || '#7a7165'
  const awayShort = awayName.split(' ')[0]
  const homeShort = homeName.split(' ')[0]
  const bg = '#f1ece1'

  return {
    type: 'div',
    props: {
      style: { width: 360, height: 640, fontFamily: 'Pretendard', background: bg, display: 'flex', flexDirection: 'column' },
      children: [
        // Header
        { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24 }, children: [
          { type: 'div', props: { style: { fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', color: '#7a7165' }, children: 'DIRECT VIEW TICKET' } },
          { type: 'div', props: { style: { fontSize: 28, fontWeight: 900, color: '#14110d', marginTop: 4 }, children: '직관 기록' } },
        ] } },

        // Ticket card
        { type: 'div', props: { style: { margin: '14px 20px 0', background: '#fafaf6', borderRadius: 16, border: '2px dashed #c8202b', display: 'flex', flexDirection: 'column', position: 'relative' }, children: [
          // Notches
          { type: 'div', props: { style: { position: 'absolute', left: -9, top: '50%', marginTop: -9, width: 18, height: 18, borderRadius: '50%', background: bg } } },
          { type: 'div', props: { style: { position: 'absolute', right: -9, top: '50%', marginTop: -9, width: 18, height: 18, borderRadius: '50%', background: bg } } },

          // Date + badge
          { type: 'div', props: { style: { padding: '14px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [
            { type: 'div', props: { style: { fontSize: 13, fontWeight: 700, color: '#3a352d', fontFamily: 'JetBrains Mono' }, children: dateStr } },
            { type: 'div', props: { style: { background: resultBg, color: 'white', fontSize: 13, fontWeight: 800, padding: '5px 14px', borderRadius: 6 }, children: resultLabel } },
          ] } },

          // Separator
          { type: 'div', props: { style: { borderTop: '1.5px dashed #d6cdb8', margin: '0 16px' } } },

          // Teams + Score
          { type: 'div', props: { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 12px 12px', gap: 12 }, children: [
            // Away
            { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80 }, children: [
              { type: 'div', props: { style: { width: 52, height: 52, borderRadius: '50%', background: awayColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 900 }, children: awayShort.charAt(0) } },
              { type: 'div', props: { style: { fontSize: 14, fontWeight: 800, marginTop: 8, color: !isHome ? awayColor : '#14110d' }, children: awayShort + (!isHome ? ' ✓' : '') } },
              { type: 'div', props: { style: { fontSize: 11, color: '#7a7165', fontWeight: 600, marginTop: 1 }, children: '원정' } },
            ] } },
            // Score
            { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }, children: [
              { type: 'div', props: { style: { fontFamily: 'JetBrains Mono', fontSize: 36, fontWeight: 900, color: '#14110d', letterSpacing: 2 }, children: `${d.awayScore}:${d.homeScore}` } },
              { type: 'div', props: { style: { fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#7a7165', marginTop: 2 }, children: 'FINAL' } },
            ] } },
            // Home
            { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80 }, children: [
              { type: 'div', props: { style: { width: 52, height: 52, borderRadius: '50%', background: homeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 900 }, children: homeShort.charAt(0) } },
              { type: 'div', props: { style: { fontSize: 14, fontWeight: 800, marginTop: 8, color: isHome ? homeColor : '#14110d' }, children: homeShort + (isHome ? ' ✓' : '') } },
              { type: 'div', props: { style: { fontSize: 11, color: '#7a7165', fontWeight: 600, marginTop: 1 }, children: '홈' } },
            ] } },
          ] } },

          // Separator
          { type: 'div', props: { style: { borderTop: '1.5px dashed #d6cdb8', margin: '0 16px' } } },

          // Venue
          { type: 'div', props: { style: { padding: '10px 18px 14px', display: 'flex', flexDirection: 'column' }, children: [
            { type: 'div', props: { style: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#7a7165' }, children: 'VENUE' } },
            { type: 'div', props: { style: { fontSize: 13, fontWeight: 700, color: '#14110d', marginTop: 2 }, children: d.stadium || '-' } },
          ] } },
        ] } },

        // Memo
        ...(d.memo ? [{ type: 'div', props: { style: { margin: '10px 20px 0', background: '#fafaf6', borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column' }, children: [
          { type: 'div', props: { style: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#7a7165', marginBottom: 4 }, children: 'MEMO' } },
          { type: 'div', props: { style: { fontSize: 13, fontWeight: 600, color: '#14110d', lineHeight: 1.5 }, children: d.memo } },
        ] } }] : []),

        // Season Record
        { type: 'div', props: { style: { margin: `${d.memo ? 10 : 16}px 20px 0`, background: '#14110d', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [
          { type: 'div', props: { style: { display: 'flex', flexDirection: 'column' }, children: [
            { type: 'div', props: { style: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#c8202b' }, children: 'SEASON RECORD' } },
            { type: 'div', props: { style: { fontSize: 13, fontWeight: 700, color: 'white', marginTop: 2 }, children: '시즌 누적' } },
          ] } },
          { type: 'div', props: { style: { fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: 900, color: 'white' }, children: `${d.seasonWins || 0}W · ${d.seasonLosses || 0}L` } },
        ] } },

        // Footer
        { type: 'div', props: { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', marginTop: 8 }, children: [
          { type: 'div', props: { style: { display: 'flex', alignItems: 'center', gap: 6 }, children: [
            { type: 'svg', props: { width: 16, height: 16, viewBox: '0 0 24 24', children: [
              { type: 'circle', props: { cx: 12, cy: 12, r: 10.5, fill: '#fafaf6', stroke: '#14110d', 'stroke-width': 1.2 } },
              { type: 'path', props: { d: 'M8 3.5C9.5 7 9.5 17 8 20.5', stroke: '#c8202b', 'stroke-width': 1.2, 'stroke-linecap': 'round', fill: 'none' } },
              { type: 'path', props: { d: 'M16 3.5C14.5 7 14.5 17 16 20.5', stroke: '#c8202b', 'stroke-width': 1.2, 'stroke-linecap': 'round', fill: 'none' } },
            ] } },
            { type: 'span', props: { style: { fontSize: 13, fontWeight: 900, color: '#14110d', letterSpacing: '0.05em' }, children: 'MATEBALL' } },
          ] } },
          { type: 'span', props: { style: { fontSize: 11, color: '#7a7165', fontWeight: 600 }, children: '@mateball.kr' } },
        ] } },
      ],
    },
  }
}

export const config = { runtime: 'edge' }

export default async function handler(req) {
  try {
    let data
    if (req.method === 'POST') {
      data = await req.json()
    } else {
      const url = new URL(req.url)
      const dataStr = url.searchParams.get('data')
      if (!dataStr) return new Response('Missing data', { status: 400 })
      data = JSON.parse(dataStr)
    }

    // 폰트 로딩
    const [pretendardRes, jetbrainsRes] = await Promise.all([
      fetch('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff2/Pretendard-Bold.woff2'),
      fetch('https://cdn.jsdelivr.net/gh/webfontworld/jetbrainsmono/JetBrainsMono-Bold.woff2'),
    ])
    const [pretendardFont, jetbrainsFont] = await Promise.all([
      pretendardRes.arrayBuffer(),
      jetbrainsRes.arrayBuffer(),
    ])

    const element = buildAttendanceCard(data)

    return new ImageResponse(element, {
      width: 1080,
      height: 1920,
      fonts: [
        { name: 'Pretendard', data: pretendardFont, weight: 700, style: 'normal' },
        { name: 'JetBrains Mono', data: jetbrainsFont, weight: 700, style: 'normal' },
      ],
    })
  } catch (err) {
    console.error('generate-card error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
