// data.jsx — shared state, data, icons, helpers

const TEAMS = {
  hanwha:  { id: 'hanwha',  short: '한화', name: '한화 이글스',   color: '#ff6b00', deep: '#000000', abbr: 'HH' },
  lg:      { id: 'lg',      short: 'LG',   name: 'LG 트윈스',     color: '#c30452', deep: '#231f20', abbr: 'LG' },
  doosan:  { id: 'doosan',  short: '두산', name: '두산 베어스',   color: '#131230', deep: '#131230', abbr: 'OB' },
  ssg:     { id: 'ssg',     short: 'SSG',  name: 'SSG 랜더스',    color: '#ce0e2d', deep: '#231f20', abbr: 'SS' },
  nc:      { id: 'nc',      short: 'NC',   name: 'NC 다이노스',   color: '#315288', deep: '#1d3461', abbr: 'NC' },
  samsung: { id: 'samsung', short: '삼성', name: '삼성 라이온즈', color: '#074ca1', deep: '#003b88', abbr: 'SS' },
  kia:     { id: 'kia',     short: 'KIA',  name: 'KIA 타이거즈',  color: '#ea0029', deep: '#06141f', abbr: 'KT' },
  kt:      { id: 'kt',      short: 'KT',   name: 'KT 위즈',       color: '#000000', deep: '#000000', abbr: 'KT' },
  lotte:   { id: 'lotte',   short: '롯데', name: '롯데 자이언츠', color: '#041e42', deep: '#041e42', abbr: 'LG' },
  kiwoom:  { id: 'kiwoom',  short: '키움', name: '키움 히어로즈', color: '#820024', deep: '#570014', abbr: 'KW' },
};

// Icons — minimal, baseball themed where possible
const Icon = {
  Home: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>,
  Ticket: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 100-4V8z"/><path d="M9 6v12" strokeDasharray="2 2"/></svg>,
  Chat: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 01-12.4 6.7L3 20l1.3-5.6A8 8 0 1121 12z"/></svg>,
  Profile: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>,
  Back: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>,
  Send: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  Logout: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>,
  Pin: (p) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Clock: (p) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Trend: (p) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>,
  Target: (p) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  Star: (p) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill={p.fill||'currentColor'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M12 2l3 7 7 .8-5.2 4.9 1.6 7-6.4-3.7L5.6 21.7l1.6-7L2 9.8 9 9z"/></svg>,
  Plus: (p) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  Camera: (p) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Trash: (p) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Caret: (p) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d={p.up?"M6 15l6-6 6 6":"M6 9l6 6 6-6"}/></svg>,
  Users: (p) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3"/><path d="M2 21a7 7 0 0114 0"/><circle cx="17" cy="7" r="2.5"/><path d="M22 19a5 5 0 00-8-4"/></svg>,
  Wifi: (p) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114 0"/><path d="M2 8.5a16 16 0 0120 0"/><path d="M8.5 16.4a6 6 0 017 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>,
};

// Team logo — a baseball with team monogram + brand color outer ring
function TeamLogo({ team, size = 56 }) {
  const t = TEAMS[team] || TEAMS.hanwha;
  return (
    <div className="team-logo" style={{ width: size, height: size, fontSize: size * 0.26 }}>
      <div style={{
        position: 'absolute', inset: -3, borderRadius: '50%',
        background: t.color, zIndex: -1,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}/>
      <span style={{ position: 'relative', zIndex: 1, color: t.deep, fontWeight: 800 }}>{t.short}</span>
    </div>
  );
}

// Game data
const GAMES_TODAY = [
  { id: 'g1', home: 'kt', away: 'lotte', time: '18:30', stadium: '수원 KT 위즈 파크', status: 'cancelled', homeP: '고영표', awayP: '박세웅' },
  { id: 'g2', home: 'lg', away: 'doosan', time: '18:30', stadium: '잠실야구장', status: 'live', homeScore: 1, awayScore: 0, inning: '3회초', homeP: '톨허스트', awayP: '최민석' },
  { id: 'g3', home: 'ssg', away: 'nc', time: '18:30', stadium: '문학야구장', status: 'live', homeScore: 3, awayScore: 5, inning: '5회말', homeP: '타케다', awayP: '테일러' },
  { id: 'g4', home: 'hanwha', away: 'lg', time: '18:30', stadium: '한화생명 이글스 파크', status: 'scheduled', homeP: '문동주', awayP: '엔스' },
  { id: 'g5', home: 'samsung', away: 'kia', time: '18:30', stadium: '대구 라이온즈파크', status: 'scheduled', homeP: '원태인', awayP: '양현종' },
];

const PREDICTIONS = [
  { date: '2026-05-06', home: 'NC 다이노스', away: '삼성 라이온즈', stadium: '창원', pick: 'NC 다이노스 승', result: 'miss' },
  { date: '2026-05-04', home: '두산 베어스', away: 'KIA 타이거즈', stadium: '잠실', pick: 'KIA 타이거즈 승', result: 'hit' },
];

const VISITS = [
  { id: 'v1', date: '5월 7일 (목)', day: 'thu', result: 'win', mode: 'direct', away: 'kia', home: 'hanwha', awayScore: 2, homeScore: 6, note: '승요' },
];

// Window globals so each Babel script can access these
Object.assign(window, { TEAMS, Icon, TeamLogo, GAMES_TODAY, PREDICTIONS, VISITS });
