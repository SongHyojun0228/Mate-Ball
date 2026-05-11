import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import TeamLogo from '../components/TeamLogo'

export default function TeamSelect() {
  const [teams, setTeams] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const updateFavoriteTeam = useAuthStore((s) => s.updateFavoriteTeam)
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('teams')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) setTeams(data)
      })
  }, [])

  const handleConfirm = async () => {
    if (!selected) return
    setLoading(true)

    try {
      await updateFavoriteTeam(selected)
      navigate('/')
    } catch {
      alert('파울볼! 다시 시도해봐요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="ball-card" style={{ padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, textAlign: 'center', marginBottom: 8 }}>응원팀 선택</h1>
        <p style={{ textAlign: 'center', color: 'var(--color-ink-muted)', fontSize: 13, marginBottom: 24 }}>
          시즌당 1회 변경 가능해요
        </p>

        <div className="grid grid-cols-2 gap-3">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelected(team.id)}
              className="ball-card"
              style={{
                padding: 16, cursor: 'pointer', textAlign: 'left',
                position: 'relative',
                border: selected === team.id
                  ? '2px solid var(--color-stitch-red)'
                  : '1px solid var(--color-line)',
                background: selected === team.id
                  ? 'rgba(200,32,43,0.04)'
                  : 'var(--color-ball-white)',
              }}
            >
              <TeamLogo team={team} size={32} />
              <p style={{ fontWeight: 800, fontSize: 13, marginTop: 8 }}>{team.name}</p>
              <p style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>{team.city}</p>
              {selected === team.id && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'var(--color-stitch-red)', color: 'white',
                  borderRadius: '50%', padding: 3,
                }}>
                  <Check size={14} />
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selected || loading}
          className="btn-stitch"
          style={{ marginTop: 24 }}
        >
          {loading ? '투구 준비 중...' : '선택 완료!'}
        </button>
      </div>
    </div>
  )
}
