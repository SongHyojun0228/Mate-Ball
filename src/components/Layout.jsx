import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Home, Trophy, Ticket, MessageCircle, User, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import TeamLogo from './TeamLogo'

export default function Layout({ children }) {
  const { user, profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const tabs = [
    { id: '/', label: '오늘의 경기', icon: Home },
    { id: '/ranking', label: '랭킹', icon: Trophy },
    { id: '/raffle', label: '추첨', icon: Ticket, auth: true },
    { id: '/messages', label: '쪽지함', icon: MessageCircle, auth: true },
    { id: '/mypage', label: '프로필', icon: User, auth: true },
  ]

  // GameRoom 등 상세 페이지에서는 탭 네비 숨김
  const hideTabNav = location.pathname.startsWith('/games/') ||
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/team-select'

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Scoreboard Header */}
      <header className="scoreboard-header" style={{ padding: '14px 16px 12px' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <img src="/favicon.svg" alt="메이트볼" style={{ width: 30, height: 30 }} />
            <span style={{ fontFamily: 'BagelFat, sans-serif', fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>메이트볼</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2.5">
              {profile?.teams && (
                <Link
                  to="/team-select"
                  className="no-underline flex items-center gap-1.5"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 999, padding: '4px 10px 4px 4px',
                  }}
                >
                  <TeamLogo team={profile.teams} size={22} />
                  <span style={{ fontFamily: 'BagelFat, sans-serif', fontSize: 12, color: 'white' }}>{profile.teams.name}</span>
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="cursor-pointer"
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)' }}
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-xs font-bold text-white/80 no-underline hover:text-white">로그인</Link>
              <Link
                to="/signup"
                className="text-xs font-bold no-underline"
                style={{
                  background: 'var(--color-stitch-red)',
                  color: 'white', padding: '6px 12px', borderRadius: 8,
                }}
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Scorecard Tab Nav */}
      {!hideTabNav && (
        <nav className="scorecard-tabnav">
          <div className="max-w-2xl mx-auto flex w-full">
            {tabs.map((tab) => {
              if (tab.auth && !user) return null
              const Icon = tab.icon
              const isActive = location.pathname === tab.id
              return (
                <Link
                  key={tab.id}
                  to={tab.id}
                  className={`scorecard-tab-item flex-1 flex items-center justify-center gap-1.5 no-underline ${isActive ? 'active' : ''}`}
                  style={{
                    padding: '12px 8px',
                    fontWeight: 700, fontSize: 13,
                    color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                    position: 'relative',
                  }}
                >
                  <Icon size={15} />
                  {tab.label}
                  {isActive && (
                    <span style={{
                      position: 'absolute', bottom: 0, left: 16, right: 16,
                      height: 3, background: 'var(--color-stitch-red)',
                      borderRadius: '2px 2px 0 0',
                    }} />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* Main content with app-bg texture */}
      <main className="app-bg flex-1">
        <div className="max-w-2xl mx-auto w-full px-3.5 py-3.5 relative z-[1]">
          {children}
        </div>
      </main>
    </div>
  )
}
