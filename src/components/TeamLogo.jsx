import { useState } from 'react'
import { teamColors } from '../lib/teamColors'

export default function TeamLogo({ team, size = 32, className = '' }) {
  const [imgError, setImgError] = useState(false)

  if (!team) return null

  const style = { width: size, height: size, minWidth: size, minHeight: size }

  if (team.logo_url && !imgError) {
    return (
      <img
        src={team.logo_url}
        alt={team.name}
        style={style}
        className={`object-contain ${className}`}
        onError={() => setImgError(true)}
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
