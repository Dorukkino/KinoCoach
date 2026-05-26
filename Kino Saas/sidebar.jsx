// Sidebar — collapsible navigation, supports coach + student menus
const COACH_NAV = [
  { section: 'Genel', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard' },
    { id: 'students', label: 'Öğrencilerim', icon: 'Students', badge: '24' },
  ]},
  { section: 'İletişim', items: [
    { id: 'chat', label: 'Chat', icon: 'Chat', badge: '7' },
    { id: 'notes', label: 'Notlar', icon: 'Notes' },
  ]},
  { section: 'Hesap', items: [
    { id: 'settings', label: 'Ayarlar', icon: 'Settings' },
  ]},
];

const STUDENT_NAV = [
  { section: 'Genel', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard' },
    { id: 'weekly', label: 'Programım', icon: 'Calendar' },
    { id: 'trials', label: 'Deneme Netlerim', icon: 'Trial' },
    { id: 'lessons', label: 'Soru Çözüm Listem', icon: 'Lessons' },
  ]},
  { section: 'İletişim', items: [
    { id: 'chat', label: 'Chat', icon: 'Chat', badge: '1' },
  ]},
  { section: 'Hesap', items: [
    { id: 'profile', label: 'Profil', icon: 'Settings' },
  ]},
];

const Sidebar = ({ collapsed, onToggle, active, onNav, role }) => {
  const nav = role === 'student' ? STUDENT_NAV : COACH_NAV;
  const me = role === 'student'
    ? { initials: 'MA', name: 'Mira Aydın', role: 'Sayısal · 12. Sınıf' }
    : { initials: 'ES', name: 'Emre Soysal', role: 'YKS Koçu' };

  return (
    <aside className="sidebar" data-screen-label="Sidebar">
      <div className="sidebar-head">
        <div className="brand-mark">k</div>
        <div className="brand-text">
          <span className="brand-name">Kino</span>
          <span className="brand-sub">{role === 'student' ? 'Student' : 'Coach'}</span>
        </div>
        <button className="collapse-btn" onClick={onToggle} aria-label="Toggle sidebar">
          <Ic.ChevDouble width="16" height="16" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 220ms' }} />
        </button>
      </div>

      <nav className="nav">
        {nav.map((group, gi) => (
          <React.Fragment key={gi}>
            <div className="nav-section-title">{group.section}</div>
            {group.items.map(it => {
              const Icon = Ic[it.icon];
              return (
                <button
                  key={it.id}
                  className={'nav-item' + (active === it.id ? ' active' : '')}
                  onClick={() => onNav(it.id)}
                  title={collapsed ? it.label : undefined}
                >
                  <Icon className="nav-icon" width="18" height="18" />
                  <span className="nav-label">{it.label}</span>
                  {it.badge && <span className="nav-badge">{it.badge}</span>}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-foot">
        <button className="user-card">
          <div className="avatar">{me.initials}</div>
          <div className="user-text">
            <span className="user-name">{me.name}</span>
            <span className="user-role">{me.role}</span>
          </div>
          <Ic.ChevRight className="chev" width="14" height="14" />
        </button>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
