// screens.jsx — all 9 screens for YAME

const { useState, useEffect, useRef } = React;

// ────────────────────────────────────────────────────────────
// Shared chrome: top scoreboard header + tab nav
// ────────────────────────────────────────────────────────────
function AppHeader({ team = 'hanwha', user = 'Otani' }) {
  const t = TEAMS[team];
  return (
    <div className="scoreboard-header" style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: 'var(--stitch-red)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13,
          letterSpacing: '0.05em',
          boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.4)',
        }}>YM</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '0.02em' }}>야메</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 999, padding: '4px 10px 4px 4px', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: t.color, border: '1.5px solid white' }}/>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{t.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontSize: 13, fontWeight: 700 }}>
          <Icon.Profile s={14}/> {user}
        </div>
      </div>
    </div>
  );
}

function TabNav({ active, onChange }) {
  const tabs = [
    { id: 'home', label: '오늘의 경기', icon: <Icon.Home s={15}/> },
    { id: 'draw', label: '추첨', icon: <Icon.Ticket s={15}/> },
    { id: 'inbox', label: '쪽지함', icon: <Icon.Chat s={15}/> },
    { id: 'profile', label: '프로필', icon: <Icon.Profile s={15}/> },
  ];
  return (
    <div className="scorecard-tabnav">
      {tabs.map(t => (
        <button key={t.id} className={active === t.id ? 'active' : ''} onClick={() => onChange(t.id)}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// HOME — today's games
// ────────────────────────────────────────────────────────────
function GameCard({ game, onClick }) {
  const home = TEAMS[game.home], away = TEAMS[game.away];
  const isLive = game.status === 'live';
  const isCancelled = game.status === 'cancelled';
  return (
    <div className="ball-card" onClick={onClick} style={{
      padding: 14, cursor: 'pointer',
      opacity: isCancelled ? 0.65 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        {isLive && <span className="badge live">LIVE · {game.inning}</span>}
        {game.status === 'scheduled' && <span className="badge scheduled">{game.time}</span>}
        {isCancelled && <span className="badge cancelled">취소</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 }}>
          <Icon.Pin s={11}/> {game.stadium}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
        {/* AWAY */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <TeamLogo team={game.away} size={44}/>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{away.name}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 600 }}>원정 · {game.awayP}</div>
        </div>

        {/* SCORE / TIME */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
          {isLive ? (
            <div className="scoreboard" style={{ padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="value" style={{ fontSize: 22 }}>{game.awayScore}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>:</span>
              <span className="value" style={{ fontSize: 22 }}>{game.homeScore}</span>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, color: 'var(--stitch-red)' }}>VS</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--ink-muted)', marginTop: 2 }}>{game.time}</div>
            </>
          )}
        </div>

        {/* HOME */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <TeamLogo team={game.home} size={44}/>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{home.name}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 600 }}>홈 · {game.homeP}</div>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ go, myTeam }) {
  const [day, setDay] = useState(7);
  const days = [
    { d: 5, w: '화', past: true },
    { d: 6, w: '수', past: true },
    { d: 7, w: '목', today: true },
    { d: 8, w: '금' },
    { d: 9, w: '토', weekend: 'sat' },
    { d: 10, w: '일', weekend: 'sun' },
    { d: 11, w: '월' },
  ];
  return (
    <div style={{ padding: '14px 14px 24px' }}>
      {/* Date strip */}
      <div className="ball-card" style={{ padding: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, paddingLeft: 4 }}>
          <Icon.Clock s={13}/>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.02em' }}>2026년 5월 · 경기 일정</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', padding: '0 4px' }}>‹</button>
          {days.map(x => (
            <button key={x.d} onClick={() => setDay(x.d)} style={{
              flex: 1, padding: '6px 0', border: 'none', borderRadius: 6,
              cursor: 'pointer',
              background: day === x.d ? 'var(--stitch-red)' : x.past ? 'var(--line-soft)' : 'transparent',
              color: day === x.d ? 'white' : x.weekend === 'sun' ? 'var(--stitch-red)' : x.weekend === 'sat' ? 'var(--grass-mid)' : 'var(--ink)',
              outline: day === x.d ? '1.5px dashed rgba(255,255,255,0.5)' : 'none',
              outlineOffset: '-3px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}>{x.w}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14 }}>{x.d}</div>
            </button>
          ))}
          <button style={{ background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', padding: '0 4px' }}>›</button>
        </div>
      </div>

      {/* Draw banner */}
      <div onClick={() => go('draw')} style={{
        background: 'linear-gradient(135deg, #fff5e8 0%, #ffe5c2 100%)',
        border: '1.5px dashed var(--stitch-red)',
        borderRadius: 12, padding: '12px 14px', marginBottom: 14,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Ticket s={22}/>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--stitch-red)', letterSpacing: '0.02em' }}>제1라운드 치킨 추첨</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>매주 10명에게 치킨!</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'var(--ink-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>내 응모권</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: 'var(--stitch-red)' }}>1장</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GAMES_TODAY.map(g => <GameCard key={g.id} game={g} onClick={() => go('game', g.id)}/>)}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// GAME DETAIL — 3 tabs (예측/매칭/응원)
// ────────────────────────────────────────────────────────────
function GameDetailScreen({ go, gameId, myTeam }) {
  const game = GAMES_TODAY.find(g => g.id === gameId) || GAMES_TODAY[3];
  const home = TEAMS[game.home], away = TEAMS[game.away];
  const isMyGame = game.home === myTeam || game.away === myTeam;
  const [tab, setTab] = useState(isMyGame ? 'cheer' : 'predict');

  return (
    <div>
      <div style={{ padding: '12px 14px 0' }}>
        <button onClick={() => go('home')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink)', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '6px 0' }}>
          <Icon.Back s={18}/> 오늘의 경기
        </button>
      </div>

      {/* Hero scoreboard */}
      <div style={{ padding: '8px 14px 0' }}>
        <div className="ball-card" style={{ padding: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--stitch-red)' }}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <TeamLogo team={game.away} size={50}/>
              <div style={{ fontSize: 14, fontWeight: 800, marginTop: 6 }}>{away.name}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 600 }}>원정</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 92 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 28, color: 'var(--stitch-red)' }}>VS</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, marginTop: 2 }}>{game.time}</div>
              <span className="badge scheduled" style={{ marginTop: 6 }}>예정</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <TeamLogo team={game.home} size={50}/>
              <div style={{ fontSize: 14, fontWeight: 800, marginTop: 6 }}>{home.name}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 600 }}>홈</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icon.Pin s={11}/> {game.stadium}
          </div>
        </div>

        {!isMyGame && (
          <div style={{
            background: 'var(--ball-white)', border: '1px solid var(--line)',
            borderRadius: 8, padding: '8px 12px', marginTop: 10,
            fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, textAlign: 'center',
          }}>
            내 응원팀 경기는 아니지만, 승부예측은 할 수 있어요!
          </div>
        )}

        {/* Dugout tabs */}
        <div className="dugout-tabs" style={{ marginTop: 12 }}>
          <button className={tab === 'predict' ? 'active' : ''} onClick={() => setTab('predict')}>
            <Icon.Trend s={14}/> 승부예측
          </button>
          <button className={tab === 'match' ? 'active' : ''} onClick={() => setTab('match')}>
            <Icon.Users s={14}/> 직관매칭
          </button>
          <button className={tab === 'cheer' ? 'active' : ''} onClick={() => setTab('cheer')} disabled={!isMyGame} style={!isMyGame ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <Icon.Chat s={14}/> 응원토크
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 14px 24px' }}>
        {tab === 'predict' && <PredictPanel game={game}/>}
        {tab === 'match' && <MatchPanel game={game}/>}
        {tab === 'cheer' && <CheerPanel game={game} myTeam={myTeam}/>}
      </div>
    </div>
  );
}

function PredictPanel({ game }) {
  const home = TEAMS[game.home], away = TEAMS[game.away];
  const [pick, setPick] = useState(null);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="ball-card" style={{ padding: 22, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>⚾</div>
        <div style={{ fontSize: 16, fontWeight: 800 }}>예측 완료!</div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>응모권 1장이 추가되었어요</div>
        <button className="btn-ghost" style={{ marginTop: 14 }} onClick={() => { setSubmitted(false); setPick(null); setReason(''); }}>다시 예측</button>
      </div>
    );
  }

  const opts = [
    { id: 'away', label: away.name, sub: '원정 승' },
    { id: 'draw', label: '무승부', sub: '' },
    { id: 'home', label: home.name, sub: '홈 승' },
  ];

  return (
    <div className="ball-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Icon.Trend s={16}/>
        <div style={{ fontSize: 14, fontWeight: 800 }}>승부 예측</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 1fr', gap: 6, marginBottom: 12 }}>
        {opts.map(o => (
          <button key={o.id}
            className={'btn-ghost' + (pick === o.id ? ' selected' : '')}
            onClick={() => setPick(o.id)}
            style={{ padding: '12px 6px', fontSize: 12 }}>
            <div style={{ fontWeight: 800 }}>{o.label}</div>
            {o.sub && <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, marginTop: 2 }}>{o.sub}</div>}
          </button>
        ))}
      </div>
      <input className="field" placeholder="한 줄 예측 이유 (선택)" value={reason} onChange={e => setReason(e.target.value)} style={{ marginBottom: 10 }}/>
      <button className="btn-stitch" disabled={!pick} onClick={() => setSubmitted(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon.Send s={15}/> 예측 제출
      </button>
    </div>
  );
}

function MatchPanel({ game }) {
  const [matches, setMatches] = useState([
    { id: 1, name: 'Otani', stars: 5, seat: '미정', drink: '무관', count: '1:1', note: '노시환장' },
  ]);
  return (
    <div>
      <button className="btn-ghost" style={{ width: '100%', borderStyle: 'dashed', borderColor: 'var(--stitch-red)', color: 'var(--stitch-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 }}>
        <Icon.Plus s={16}/> 직관 동행 구하기
      </button>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {matches.map(m => (
          <div key={m.id} className="ball-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{m.name}</span>
                <Icon.Star s={12} fill="var(--stitch-red)"/>
                <span className="num" style={{ fontWeight: 700, fontSize: 13, color: 'var(--stitch-red)' }}>{m.stars}</span>
              </div>
              <span className="badge scheduled">모집중</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {[m.seat, m.drink, m.count].map(x => (
                <span key={x} style={{ background: 'var(--ball-cream)', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)' }}>{x}</span>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{m.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheerPanel({ game, myTeam }) {
  const [msgs, setMsgs] = useState([
    { id: 1, name: 'Otani', team: myTeam, text: '가작자', time: '오전 12:17' },
    { id: 2, name: 'Otani', team: myTeam, text: '가자가자~', time: '오전 12:18' },
  ]);
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    setMsgs([...msgs, { id: Date.now(), name: 'Otani', team: myTeam, text, time: '지금' }]);
    setText('');
  };

  return (
    <div className="ball-card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px dashed var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 14 }}>
          <Icon.Chat s={14}/> 응원토크
        </div>
        <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 }}>{msgs.length}개 메시지</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflow: 'auto', marginBottom: 10 }}>
        {msgs.map(m => (
          <div key={m.id} style={{ borderLeft: '3px solid var(--stitch-red)', paddingLeft: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--stitch-red)' }}>{m.name}</span>
                <span style={{ background: 'var(--ball-cream)', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{TEAMS[m.team].name}</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 600 }}>{m.time}</span>
            </div>
            <div style={{ fontSize: 13 }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input className="field" placeholder="응원 한마디 날려봐요!" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}/>
        <button onClick={send} disabled={!text.trim()} style={{ width: 44, height: 44, borderRadius: 10, border: 'none', background: 'var(--stitch-red)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: text.trim() ? 1 : 0.5 }}>
          <Icon.Send s={16}/>
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// DRAW (치킨 추첨)
// ────────────────────────────────────────────────────────────
function DrawScreen({ go }) {
  return (
    <div style={{ padding: '14px 14px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Icon.Ticket s={22}/>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>치킨 추첨</h2>
      </div>

      {/* Big ticket */}
      <div className="ball-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{ background: 'linear-gradient(180deg, #1f4329 0%, #14301c 100%)', padding: '16px 18px', color: 'white', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em' }}>ROUND 01 · 진행중</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, marginTop: 4, color: '#ffd76b', textShadow: '0 0 10px rgba(255,200,80,0.4)' }}>치킨 1마리</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>5.4 → 5.10 · 매주 10명 추첨</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px dashed rgba(255,215,107,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffd76b' }}>
              <Icon.Ticket s={20}/>
            </div>
          </div>
        </div>

        {/* Ticket perforation */}
        <div style={{ height: 0, position: 'relative', borderTop: '1.5px dashed var(--line)' }}>
          <div style={{ position: 'absolute', left: -8, top: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--ball-cream)' }}/>
          <div style={{ position: 'absolute', right: -8, top: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--ball-cream)' }}/>
        </div>

        <div style={{ padding: '20px 18px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: '0.1em' }}>내 응모권</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 56, fontWeight: 800, color: 'var(--stitch-red)', lineHeight: 1, margin: '6px 0' }}>1<span style={{ fontSize: 28, marginLeft: 4 }}>장</span></div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>승부예측 참여하면 응모권을 받아요!</div>
        </div>
      </div>

      <div className="ball-card" style={{ padding: 16, marginTop: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>응모권 얻는 방법</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['1', '경기방에서 승부예측에 참여하면 경기당 1장'],
            ['2', '매주 라운드 종료 후 자동 추첨'],
            ['3', '당첨자는 야메 공지로 안내'],
          ].map(([n, t]) => (
            <div key={n} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--stitch-red)', color: 'white', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
              <div style={{ fontSize: 13, paddingTop: 2 }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--ball-cream)', borderRadius: 8, padding: '8px 12px', marginTop: 12, fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center', fontWeight: 600 }}>
          공익 기간 중 모든 기능 무료! 무료 유저도 추첨 참여 가능
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// INBOX
// ────────────────────────────────────────────────────────────
function InboxScreen({ go }) {
  const threads = [
    { id: 't1', name: '야마모토요시노부', game: '한화 이글스 vs LG 트윈스', date: '2026-05-08', last: '네', time: '오전 12:19', unread: 0 },
    { id: 't2', name: '구창모', game: 'NC 다이노스 vs 삼성', date: '2026-05-06', last: '같이 가요!', time: '어제', unread: 2 },
  ];
  return (
    <div style={{ padding: '14px 14px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>쪽지함</h2>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 600 }}>{threads.length}개 대화</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {threads.map(t => (
          <div key={t.id} className="ball-card" onClick={() => go('thread', t.id)} style={{ padding: 14, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                {t.name}
                {t.unread > 0 && <span style={{ background: 'var(--stitch-red)', color: 'white', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 8 }}>{t.unread}</span>}
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 }}>{t.time}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600, marginBottom: 4 }}>{t.game} · {t.date}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t.last}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// THREAD (쪽지)
// ────────────────────────────────────────────────────────────
function ThreadScreen({ go }) {
  const [msgs, setMsgs] = useState([
    { id: 1, me: true, text: '안녕하세요', time: '오전 12:19' },
    { id: 2, me: false, text: '네', time: '오전 12:19' },
  ]);
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    setMsgs([...msgs, { id: Date.now(), me: true, text, time: '지금' }]);
    setText('');
    setTimeout(() => {
      setMsgs(m => [...m, { id: Date.now()+1, me: false, text: '좋아요!', time: '지금' }]);
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="scoreboard-header" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}>
        <button onClick={() => go('inbox')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
          <Icon.Back s={20}/>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>야마모토요시노부</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>한화 이글스 vs LG 트윈스 · 05.08</div>
        </div>
        <Icon.Wifi s={16}/>
      </div>

      <div style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
        {msgs.map(m => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.me ? 'flex-end' : 'flex-start' }}>
            <div className={'bubble ' + (m.me ? 'me' : 'them')}>{m.text}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 2, fontWeight: 600 }}>{m.time}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 10, background: 'var(--ball-white)', borderTop: '1px solid var(--line)', display: 'flex', gap: 6 }}>
        <input className="field" placeholder="메시지를 입력해봐요" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}/>
        <button onClick={send} disabled={!text.trim()} style={{ width: 44, height: 44, borderRadius: 10, border: 'none', background: 'var(--stitch-red)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: text.trim() ? 1 : 0.5 }}>
          <Icon.Send s={16}/>
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// PROFILE
// ────────────────────────────────────────────────────────────
function ProfileScreen({ go, myTeam }) {
  const [tab, setTab] = useState('predict');
  const t = TEAMS[myTeam];

  return (
    <div style={{ padding: '14px 14px 24px' }}>
      {/* Player card hero */}
      <div className="ball-card" style={{ padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 32, background: t.color, opacity: 0.18 }}/>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--grass-deep)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 26,
            border: '3px solid var(--ball-white)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>O</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Otani</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 2 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.color }}/>
              <span style={{ fontWeight: 700 }}>{t.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Icon.Star s={13} fill="var(--stitch-red)"/>
              <span className="num" style={{ fontWeight: 800, fontSize: 13, color: 'var(--stitch-red)' }}>5</span>
              <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 }}>직관 매너</span>
              <span style={{ background: 'var(--ink)', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>MVP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat grid — like a baseball card stat line */}
      <div className="ball-card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--ink-muted)', marginBottom: 8 }}>SEASON STATS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 8 }}>
          {[
            ['총예측', '2'], ['적중', '1'], ['적중률', '50%'], ['직관', '1'], ['승률', '100%'],
          ].map(([l, v]) => (
            <div key={l} className="stat-tile" style={{ padding: '8px 4px' }}>
              <div className="stat-num" style={{ fontSize: 18 }}>{v}</div>
              <div className="stat-label">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Draw ticket mini */}
      <div className="ball-card" style={{ padding: 14, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Ticket s={22}/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>치킨 추첨</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 }}>이번 주 응모권 1장 · 총 당첨 0회</div>
          </div>
        </div>
        <button className="btn-ghost" onClick={() => go('draw')} style={{ padding: '6px 12px', fontSize: 12 }}>보기</button>
      </div>

      {/* Tab toggle */}
      <div className="dugout-tabs" style={{ marginBottom: 12 }}>
        <button className={tab === 'predict' ? 'active' : ''} onClick={() => setTab('predict')}>
          <Icon.Trend s={14}/> 예측 기록
        </button>
        <button className={tab === 'visit' ? 'active' : ''} onClick={() => setTab('visit')}>
          <Icon.Pin s={14}/> 직관 기록
        </button>
      </div>

      {tab === 'predict' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PREDICTIONS.map((p, i) => (
            <div key={i} className="ball-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-muted)', fontWeight: 700 }}>{p.date}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{p.away} <span style={{ color: 'var(--stitch-red)' }}>vs</span> {p.home}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600, marginTop: 2 }}>{p.stadium}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge" style={{ background: p.result === 'hit' ? 'var(--grass-mid)' : 'var(--dirt-warm)', color: 'white' }}>
                    {p.result === 'hit' ? '적중' : '아쉽'}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700, marginTop: 6 }}>{p.pick}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'visit' && <VisitList/>}
    </div>
  );
}

function VisitList() {
  const [expanded, setExpanded] = useState('v1');
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 10 }}>
        {[['직관','1'],['승','1'],['패','0'],['무','0'],['승률','100%']].map(([l,v]) => (
          <div key={l} className="stat-tile" style={{ padding: '8px 4px' }}>
            <div className="stat-num" style={{ fontSize: 18 }}>{v}</div>
            <div className="stat-label">{l}</div>
          </div>
        ))}
      </div>
      <button className="btn-ghost" style={{ width: '100%', borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, marginBottom: 10 }}>
        <Icon.Plus s={16}/> 직관 기록 추가
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {VISITS.map(v => (
          <div key={v.id} className="ball-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div onClick={() => setExpanded(expanded === v.id ? null : v.id)} style={{ padding: 14, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 700 }}>{v.date}</span>
                  <span style={{ background: 'var(--grass-mid)', color: 'white', fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 4 }}>승</span>
                  <span style={{ background: 'var(--ball-cream)', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, color: 'var(--ink-soft)' }}>직접</span>
                </div>
                <Icon.Caret s={14} up={expanded === v.id}/>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TeamLogo team={v.away} size={28}/>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{TEAMS[v.away].name}</span>
                <span className="num" style={{ fontWeight: 800, fontSize: 14, color: 'var(--stitch-red)' }}>{v.awayScore} : {v.homeScore}</span>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{TEAMS[v.home].name}</span>
                <TeamLogo team={v.home} size={28}/>
              </div>
            </div>
            {expanded === v.id && (
              <div style={{ borderTop: '1px dashed var(--line)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-muted)', fontWeight: 600 }}>
                  <Icon.Camera s={14}/> 사진 추가 (0/5)
                </div>
                <div style={{ fontSize: 13 }}>{v.note}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-muted)', fontWeight: 600, cursor: 'pointer' }}>
                  <Icon.Trash s={13}/> 기록 삭제
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  AppHeader, TabNav,
  HomeScreen, GameDetailScreen, DrawScreen, InboxScreen, ThreadScreen, ProfileScreen,
});
