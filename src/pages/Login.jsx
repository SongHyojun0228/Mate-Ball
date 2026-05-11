import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const signIn = useAuthStore((s) => s.signIn)
  const signInWithKakao = useAuthStore((s) => s.signInWithKakao)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError('파울볼! 이메일 또는 비밀번호를 확인해봐요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="ball-card" style={{ padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, textAlign: 'center', marginBottom: 24 }}>로그인</h1>

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
              className="field-input"
              placeholder="비밀번호"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-stitch">
            <LogIn size={18} />
            {loading ? '투구 준비 중...' : '로그인'}
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
          아직 계정이 없나요?{' '}
          <Link to="/signup" style={{ color: 'var(--color-stitch-red)', fontWeight: 700 }}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
