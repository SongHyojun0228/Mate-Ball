import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const signUp = useAuthStore((s) => s.signUp)
  const signInWithKakao = useAuthStore((s) => s.signInWithKakao)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요.')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, nickname)
      navigate('/team-select')
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setError('이미 등록된 이메일이에요.')
      } else if (err.message?.includes('nickname')) {
        setError('이미 사용 중인 닉네임이에요.')
      } else {
        setError('파울볼! 다시 시도해봐요. ' + (err.message || ''))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="ball-card" style={{ padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, textAlign: 'center', marginBottom: 24 }}>회원가입</h1>

        {error && (
          <div style={{
            background: 'rgba(200,32,43,0.08)', color: 'var(--color-stitch-red)',
            fontSize: 13, borderRadius: 8, padding: 12, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              maxLength={20}
              className="field-input"
              placeholder="야구장에서 불릴 이름"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field-input"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="field-input"
              placeholder="6자 이상"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-stitch">
            <UserPlus size={18} />
            {loading ? '투구 준비 중...' : '회원가입'}
          </button>
        </form>

        {/* 구분선 */}
        <div className="flex items-center gap-3" style={{ margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-line)' }} />
          <span style={{ fontSize: 12, color: 'var(--color-ink-muted)', fontWeight: 600 }}>또는</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-line)' }} />
        </div>

        {/* 카카오 로그인 */}
        <button
          type="button"
          onClick={async () => {
            try {
              await signInWithKakao()
            } catch {
              setError('카카오 로그인에 실패했어요.')
            }
          }}
          style={{
            width: '100%', padding: '12px 20px',
            background: '#FEE500', color: '#191919',
            border: 'none', borderRadius: 10,
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.029 2 1 5.13 1 8.97c0 2.48 1.657 4.66 4.148 5.88l-1.06 3.88c-.094.34.296.62.588.42L8.6 16.48c.46.06.93.09 1.4.09 4.971 0 9-3.13 9-6.97S14.971 2 10 2z" fill="#191919"/>
          </svg>
          카카오로 시작하기
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-ink-muted)', marginTop: 16 }}>
          이미 계정이 있나요?{' '}
          <Link to="/login" style={{ color: 'var(--color-stitch-red)', fontWeight: 700 }}>
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
