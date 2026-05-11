import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import TeamLogo from '../components/TeamLogo'

export default function TeamSelect() {
  const [teams, setTeams] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [nickname, setNickname] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const { profile, updateFavoriteTeam, fetchProfile, user } = useAuthStore()
  const navigate = useNavigate()

  // 30일 제한 체크
  const teamChangedAt = profile?.team_changed_at ? new Date(profile.team_changed_at) : null
  const nextChangeDate = teamChangedAt ? new Date(teamChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000) : null
  const isTeamChangeLocked = nextChangeDate && nextChangeDate > new Date() && profile?.favorite_team_id

  useEffect(() => {
    supabase
      .from('teams')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) setTeams(data)
      })
  }, [])

  useEffect(() => {
    if (profile?.nickname) setNickname(profile.nickname)
  }, [profile])

  const handleConfirm = async () => {
    if (!selected && !isTeamChangeLocked) return
    const trimmed = nickname.trim()
    if (!trimmed) {
      setNicknameError('닉네임을 입력해주세요.')
      return
    }
    setNicknameError('')
    setLoading(true)

    try {
      // 닉네임이 변경됐으면 업데이트
      if (trimmed !== profile?.nickname) {
        const { error } = await supabase
          .from('profiles')
          .update({ nickname: trimmed })
          .eq('id', user.id)
        if (error) {
          if (error.message?.includes('duplicate') || error.code === '23505') {
            setNicknameError('이미 사용 중인 닉네임이에요.')
            setLoading(false)
            return
          }
          throw error
        }
      }
      // 팀 변경이 잠겨있지 않고 선택된 팀이 현재와 다르면 업데이트
      if (!isTeamChangeLocked && selected && selected !== profile?.favorite_team_id) {
        await updateFavoriteTeam(selected)
      }
      await fetchProfile(user.id)
      navigate('/')
    } catch (err) {
      if (err.message?.includes('30일')) {
        alert(err.message)
      } else {
        alert('파울볼! 다시 시도해봐요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="ball-card" style={{ padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, textAlign: 'center', marginBottom: 8 }}>프로필 설정</h1>
        <p style={{ textAlign: 'center', color: 'var(--color-ink-muted)', fontSize: 13, marginBottom: 20 }}>
          닉네임과 응원팀을 설정해주세요
        </p>

        {/* 닉네임 입력 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setNicknameError('') }}
            maxLength={20}
            className="field-input"
            placeholder="야구장에서 불릴 이름"
          />
          {nicknameError && (
            <p style={{ fontSize: 12, color: 'var(--color-stitch-red)', marginTop: 4, fontWeight: 600 }}>
              {nicknameError}
            </p>
          )}
        </div>

        {/* 응원팀 선택 */}
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          응원팀 <span style={{ color: 'var(--color-ink-muted)', fontWeight: 600 }}>· 30일에 1회 변경</span>
        </div>

        {isTeamChangeLocked && (
          <div className="flex items-center gap-2" style={{
            background: 'rgba(200,32,43,0.05)', border: '1px solid rgba(200,32,43,0.15)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 12,
            fontSize: 12, fontWeight: 600, color: 'var(--color-stitch-red)',
          }}>
            <Lock size={14} />
            다음 변경 가능일: {nextChangeDate.getFullYear()}-{String(nextChangeDate.getMonth() + 1).padStart(2, '0')}-{String(nextChangeDate.getDate()).padStart(2, '0')}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3" style={isTeamChangeLocked ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
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
          disabled={(!selected && !isTeamChangeLocked) || !nickname.trim() || loading}
          className="btn-stitch"
          style={{ marginTop: 24 }}
        >
          {loading ? '투구 준비 중...' : isTeamChangeLocked ? '닉네임 변경' : '선택 완료!'}
        </button>
      </div>
    </div>
  )
}
