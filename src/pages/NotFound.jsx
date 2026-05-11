import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="text-center" style={{ padding: '80px 20px' }}>
      <div className="num" style={{ fontSize: 64, fontWeight: 800, color: 'var(--color-stitch-red)', marginBottom: 16 }}>
        404
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink-soft)', marginBottom: 24 }}>
        파울볼! 페이지를 찾을 수 없어요.
      </p>
      <Link to="/" className="btn-stitch no-underline" style={{ display: 'inline-flex', width: 'auto', padding: '12px 24px' }}>
        홈으로 돌아가기
      </Link>
    </div>
  )
}
