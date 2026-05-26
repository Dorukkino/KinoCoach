// App router — handles coach + student panels via hash routing
const { useState, useEffect } = React;

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#5B9A93",
  "density": "comfortable",
  "showNudge": true,
  "theme": "light"
}/*EDITMODE-END*/;

const ACCENT_VARS = {
  '#5B9A93': { '--accent': 'oklch(0.6 0.07 180)', '--accent-soft': 'oklch(0.96 0.025 180)', '--accent-ink': 'oklch(0.4 0.07 180)' },
  '#7A88B8': { '--accent': 'oklch(0.6 0.08 265)', '--accent-soft': 'oklch(0.96 0.025 265)', '--accent-ink': 'oklch(0.4 0.09 265)' },
  '#86A876': { '--accent': 'oklch(0.65 0.08 140)','--accent-soft': 'oklch(0.96 0.03 140)',  '--accent-ink': 'oklch(0.42 0.09 140)' },
  '#C28A6A': { '--accent': 'oklch(0.65 0.08 50)', '--accent-soft': 'oklch(0.96 0.03 50)',   '--accent-ink': 'oklch(0.45 0.09 50)' },
};

// ── Routing ──────────────────────────────────────────────────────────────
function parseHash() {
  const h = window.location.hash.replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts.length === 0) return { role: 'coach', page: 'dashboard', id: null };
  const role = parts[0] === 'student' ? 'student' : 'coach';
  const page = parts[1] || 'dashboard';
  const id = parts[2] || null;
  return { role, page, id };
}
function setHash(role, page, id) {
  const next = '#/' + role + '/' + page + (id ? '/' + id : '');
  if (window.location.hash !== next) window.location.hash = next;
}

const COACH_PAGE_LABELS = {
  dashboard: 'Dashboard', students: 'Öğrencilerim',
  chat: 'Chat', notes: 'Notlar', settings: 'Ayarlar',
};
const STUDENT_PAGE_LABELS = {
  dashboard: 'Dashboard', weekly: 'Programım',
  trials: 'Deneme Netlerim', lessons: 'Soru Çözüm Listem',
  chat: 'Chat', profile: 'Profil',
};

const App = () => {
  const [route, setRoute] = useState(parseHash());
  const [collapsed, setCollapsed] = useState(false);
  const [feedFilter, setFeedFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [nudgeOpen, setNudgeOpen] = useState(true);
  const [tweaks, setTweak] = useTweaks(TWEAKS_DEFAULTS);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) setHash('coach', 'dashboard');
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Accent
  useEffect(() => {
    const root = document.documentElement;
    const a = ACCENT_VARS[tweaks.accent] || ACCENT_VARS['#5B9A93'];
    Object.entries(a).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [tweaks.accent]);

  // Density
  useEffect(() => {
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.density]);

  // Theme
  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
  }, [tweaks.theme]);

  const navigate = (page, id) => setHash(route.role, page, id);
  const switchRole = (r) => setHash(r, 'dashboard');

  const labels = route.role === 'student' ? STUDENT_PAGE_LABELS : COACH_PAGE_LABELS;
  // Determine sidebar active
  const sidebarActive = route.page === 'students' && route.id ? 'students' : route.page;

  let screen = null;
  if (route.role === 'coach') {
    if (route.page === 'students' && route.id) {
      screen = <StudentDetail studentId={route.id} onBack={() => navigate('students')} />;
    } else if (route.page === 'students') {
      screen = <StudentsPage onOpenStudent={(id) => navigate('students', id)} />;
    } else if (route.page === 'weekly') {
      screen = <WeeklyProgram role="coach" />;
    } else if (route.page === 'trials') {
      screen = <TrialScores role="coach" />;
    } else if (route.page === 'lessons') {
      screen = <LessonScores role="coach" />;
    } else if (route.page === 'chat') {
      screen = <ChatPage role="coach" />;
    } else if (route.page === 'notes') {
      screen = <NotesPage />;
    } else if (route.page === 'settings') {
      screen = <SettingsPlaceholder role="coach" />;
    } else {
      screen = <CoachDashboard
        feedFilter={feedFilter} setFeedFilter={setFeedFilter}
        studentFilter={studentFilter} setStudentFilter={setStudentFilter}
        nudgeOpen={nudgeOpen} setNudgeOpen={setNudgeOpen}
        showNudge={tweaks.showNudge}
      />;
    }
  } else {
    // student
    if (route.page === 'weekly') {
      screen = <WeeklyProgram role="student" />;
    } else if (route.page === 'trials') {
      screen = <TrialScores role="student" />;
    } else if (route.page === 'lessons') {
      screen = <LessonScores role="student" />;
    } else if (route.page === 'chat') {
      screen = <ChatPage role="student" initialStudentId="s1" />;
    } else if (route.page === 'profile') {
      screen = <SettingsPlaceholder role="student" />;
    } else {
      screen = <StudentDashboard />;
    }
  }

  return (
    <div className="app" data-collapsed={collapsed} data-screen-label={'App · ' + (route.role === 'coach' ? 'Coach' : 'Student')}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} active={sidebarActive} onNav={(id) => navigate(id)} role={route.role} />

      <div className="main">
        <header className="topbar">
          <div className="crumbs">
            <span>{route.role === 'coach' ? 'Koç Paneli' : 'Öğrenci Paneli'}</span>
            <Ic.ChevRight width="12" height="12" className="sep" />
            <span className="cur">{labels[route.page] || labels.dashboard}</span>
            {route.id && (
              <>
                <Ic.ChevRight width="12" height="12" className="sep" />
                <span className="cur">{findStudent(route.id).name}</span>
              </>
            )}
          </div>

          <div className="search">
            <Ic.Search width="15" height="15" className="search-icon" />
            <input placeholder="Öğrenci, deneme, görev ara…" />
            <kbd>⌘ K</kbd>
          </div>

          <div className="topbar-actions">
            <RoleSwitcher role={route.role} onChange={switchRole} />
            <button className="icon-btn" aria-label="Bildirimler">
              <Ic.Bell width="16" height="16" />
              <span className="dot" />
            </button>
            <button className="btn btn-primary">
              <Ic.Plus width="14" height="14" /><span>{route.role === 'coach' ? 'Yeni Görev' : 'Net Ekle'}</span>
            </button>
          </div>
        </header>

        <main className="content">
          {screen}
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Görünüm" />
        <TweakRadio
          label="Tema"
          value={tweaks.theme}
          onChange={v => setTweak('theme', v)}
          options={[
            { value: 'light', label: 'Açık' },
            { value: 'dark', label: 'Koyu' },
          ]}
        />
        <TweakColor
          label="Aksan"
          value={tweaks.accent}
          onChange={v => setTweak('accent', v)}
          options={['#5B9A93', '#7A88B8', '#86A876', '#C28A6A']}
        />
        <TweakRadio
          label="Yoğunluk"
          value={tweaks.density}
          onChange={v => setTweak('density', v)}
          options={[
            { value: 'comfortable', label: 'Rahat' },
            { value: 'compact', label: 'Sıkı' },
          ]}
        />
        <TweakSection label="Rol" />
        <TweakRadio
          label="Görüntüle"
          value={route.role}
          onChange={v => switchRole(v)}
          options={[
            { value: 'coach', label: 'Koç' },
            { value: 'student', label: 'Öğrenci' },
          ]}
        />
        <TweakToggle
          label="AI öneri bandı"
          value={tweaks.showNudge}
          onChange={v => { setTweak('showNudge', v); if (v) setNudgeOpen(true); }}
        />
      </TweaksPanel>
    </div>
  );
};

function RoleSwitcher({ role, onChange }) {
  return (
    <div className="role-switch" data-role={role}>
      <button className={role === 'coach' ? 'active' : ''} onClick={() => onChange('coach')} title="Koç görünümü">
        <Ic.Students width="13" height="13" />
        Koç
      </button>
      <button className={role === 'student' ? 'active' : ''} onClick={() => onChange('student')} title="Öğrenci görünümü">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-5 9 5-9 5z"/><path d="M21 9v5"/><path d="M7 11.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-3.5"/></svg>
        Öğrenci
      </button>
    </div>
  );
}

function SettingsPlaceholder({ role }) {
  return (
    <div className="screen" data-screen-label="Ayarlar">
      <div className="page-head">
        <div className="page-title">
          <h1>{role === 'coach' ? 'Ayarlar' : 'Profil'}</h1>
          <p>Hesap, bildirimler ve gizlilik ayarları</p>
        </div>
      </div>
      <div className="panel" style={{ padding: 32, textAlign: 'center' }}>
        <span style={{ display: 'inline-block', padding: '6px 12px', background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 999, fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Yakında</span>
        <p style={{ marginTop: 16, color: 'var(--muted)' }}>Bu bölüm bir sonraki sürümde tasarlanacak.</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
