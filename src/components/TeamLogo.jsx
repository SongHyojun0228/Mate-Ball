import { useState } from 'react'
import { teamColors } from '../lib/teamColors'
import { getTeamLogoUrl } from '../lib/shareUtils'

export default function TeamLogo({ team, size = 32, className = '' }) {
  const [svgError, setSvgError] = useState(false)

  if (!team) return null

  const style = { width: size, height: size, minWidth: size, minHeight: size }

  const localSvg = getTeamLogoUrl(team.id)

  if (localSvg && !svgError) {
    return (
      <img
        src={localSvg}
        alt={team.name}
        style={style}
        className={`object-contain ${className}`}
        onError={() => setSvgError(true)}
      />
    )
  }

  const colorClass = teamColors[team.id] || 'bg-gray-500'

  return (
    <div
      style={style}
      className={`rounded-full ${colorClass} ${className}`}
    />
  )
}
