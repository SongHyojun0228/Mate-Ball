const teamLogoFile = {
  KIA: 'KIA', LG: 'LG', SSG: 'SSG', KT: 'KT', NC: 'NC',
  '두산': 'doosan', '한화': 'hanwha', '롯데': 'lotte', '삼성': 'samsung', '키움': 'kiwoom',
}

export function getTeamLogoUrl(teamId) {
  const file = teamLogoFile[teamId]
  return file ? `/team_logo/${file}.svg` : null
}

export const teamHexColors = {
  KIA: '#e3242b',
  LG: '#a50034',
  SSG: '#c73a42',
  KT: '#000000',
  NC: '#1e3264',
  '두산': '#13274f',
  '한화': '#ff6600',
  '롯데': '#2563eb',
  '삼성': '#0066b3',
  '키움': '#7b2d8b',
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function shareBlob(blob, filename) {
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: '메이트볼', text: '야구는 같이 봐야 제맛' })
    return true
  }
  return false
}
