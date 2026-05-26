// Activity feed (timeline) and Student Status list
const AVATAR_PALETTE = [
  ['#D4B98C', '#B89968'], // sand
  ['#A8B5A1', '#7E8E78'], // sage
  ['#B8A4C9', '#8F7BA8'], // mauve
  ['#C9A4A0', '#A47873'], // clay
  ['#9FB6C9', '#7392AB'], // sky
  ['#D9C29F', '#B69E76'], // wheat
  ['#A4C9B8', '#74A892'], // teal
  ['#C9B8A4', '#A89678'], // sand2
];
const colorFor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};
const initialsOf = (name) => name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

const Avatar = ({ name, size = 36 }) => {
  const [a, b] = colorFor(name);
  return (
    <div className="feed-avatar" style={{ width: size, height: size, background: `linear-gradient(135deg, ${a}, ${b})`, fontSize: size * 0.36 }}>
      {initialsOf(name)}
    </div>
  );
};
const SAvatar = ({ name, size = 36 }) => {
  const [a, b] = colorFor(name);
  return (
    <div className="s-avatar" style={{ width: size, height: size, background: `linear-gradient(135deg, ${a}, ${b})`, fontSize: size * 0.36 }}>
      {initialsOf(name)}
    </div>
  );
};

const TAG_ICON = {
  test: { ico: Ic.Trial, cls: 't-test' },
  task: { ico: Ic.Check, cls: 't-task' },
  msg: { ico: Ic.Chat, cls: 't-msg' },
  note: { ico: Ic.Notes, cls: 't-note' },
};

const ACTIVITY = [
  { who: 'Ahmet Yılmaz', text: 'haftalık deneme netlerini ekledi.', meta: 'TYT 96.5', kind: 'test', tag: 'Deneme', time: '2 dk önce' },
  { who: 'Ayşe Demir', text: 'haftalık görevlerin %90’ını tamamladı.', meta: '27/30 görev', kind: 'task', tag: 'Görev', time: '18 dk önce' },
  { who: 'Mehmet Aksoy', text: 'sana yeni bir mesaj gönderdi.', meta: '"Matematik sorusunda…"', kind: 'msg', tag: 'Mesaj', time: '1 sa önce' },
  { who: 'Zeynep Korkmaz', text: 'AYT denemesinde kişisel rekor kırdı.', meta: 'AYT 78.25', kind: 'test', tag: 'Deneme', time: '3 sa önce' },
  { who: 'Burak Şahin', text: 'koçluk notuna yorum bıraktı.', meta: '"Anladım hocam"', kind: 'note', tag: 'Not', time: '5 sa önce' },
  { who: 'Selin Aydın', text: 'haftalık programını onayladı.', meta: '28 Mayıs haftası', kind: 'task', tag: 'Program', time: 'Dün, 21:14' },
];

const ActivityFeed = ({ filter, setFilter }) => {
  const filtered = filter === 'all' ? ACTIVITY : ACTIVITY.filter(a => a.kind === filter);
  return (
    <section className="panel" data-screen-label="Son Aktiviteler">
      <header className="panel-head">
        <div className="panel-title">
          <h3>Son Aktiviteler</h3>
          <p>Öğrencilerinizin bugünkü hareketleri</p>
        </div>
        <div className="tabs">
          {[
            ['all', 'Tümü'],
            ['test', 'Denemeler'],
            ['task', 'Görevler'],
            ['msg', 'Mesajlar'],
          ].map(([k, l]) => (
            <button key={k} className={'tab' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </header>
      <div className="panel-body">
        <div className="feed">
          {filtered.map((a, i) => {
            const Tag = TAG_ICON[a.kind];
            return (
              <div className="feed-item" key={i}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={a.who} />
                  <span className={'feed-tag ' + Tag.cls}>
                    <Tag.ico />
                  </span>
                </div>
                <div className="feed-body">
                  <p className="feed-text"><b>{a.who}</b> {a.text}</p>
                  <div className="feed-meta">
                    <span className="chip">{a.tag}</span>
                    <span>{a.meta}</span>
                  </div>
                </div>
                <span className="feed-time">{a.time}</span>
                <span className="line" />
              </div>
            );
          })}
        </div>
        <div className="feed-more">
          <button>Tüm aktiviteleri gör →</button>
        </div>
      </div>
    </section>
  );
};

const STUDENTS = [
  { name: 'Ahmet Yılmaz', grade: '12. Sınıf', track: 'Sayısal', status: 'good', progress: 92, last: 'TYT 96.5' },
  { name: 'Zeynep Korkmaz', grade: '12. Sınıf', track: 'Sayısal', status: 'good', progress: 88, last: 'AYT 78.25' },
  { name: 'Ayşe Demir', grade: '11. Sınıf', track: 'Eşit Ağırlık', status: 'warn', progress: 64, last: 'TYT 71.0' },
  { name: 'Selin Aydın', grade: '12. Sınıf', track: 'Söz‑Eş.', status: 'warn', progress: 58, last: 'TYT 68.75' },
  { name: 'Mehmet Aksoy', grade: '12. Sınıf', track: 'Sayısal', status: 'risk', progress: 34, last: '4 gün önce' },
  { name: 'Burak Şahin', grade: '11. Sınıf', track: 'Sayısal', status: 'risk', progress: 28, last: '6 gün önce' },
];
const STATUS_LABEL = { good: 'İyi gidiyor', warn: 'Ortalama', risk: 'Riskli' };
const COUNTS = STUDENTS.reduce((a, s) => (a[s.status]++, a), { good: 0, warn: 0, risk: 0 });

const StudentList = ({ filter, setFilter }) => {
  const visible = filter === 'all' ? STUDENTS : STUDENTS.filter(s => s.status === filter);
  return (
    <section className="panel students-panel" data-screen-label="Öğrenci Durumları">
      <header className="panel-head">
        <div className="panel-title">
          <h3>Öğrenci Durumları</h3>
          <p>Bir bakışta tüm öğrencilerinin gidişatı</p>
        </div>
        <div className="filter-tabs">
          {[
            ['all', 'Tümü', STUDENTS.length, null],
            ['good', 'İyi', COUNTS.good, 'good'],
            ['warn', 'Orta', COUNTS.warn, 'warn'],
            ['risk', 'Riskli', COUNTS.risk, 'risk'],
          ].map(([k, l, c, dot]) => (
            <button key={k} className={'filter-tab' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>
              {dot && <span className={'dot-st ' + dot} />}
              {l}
              <span className="count">{c}</span>
            </button>
          ))}
        </div>
      </header>
      <div className="panel-body">
        <div className="legend">
          <span className="legend-item"><span className="dot-st good" /> İyi gidiyor</span>
          <span className="legend-item"><span className="dot-st warn" /> Ortalama ilerliyor</span>
          <span className="legend-item"><span className="dot-st risk" /> Riskli öğrenci</span>
        </div>
        {visible.map((s, i) => (
          <div key={i} className={'student-row s-' + s.status}>
            <SAvatar name={s.name} />
            <div className="s-info">
              <span className="s-name">{s.name}</span>
              <span className="s-meta">
                <span>{s.grade}</span><span className="sep" />
                <span>{s.track}</span><span className="sep" />
                <span>{s.last}</span>
              </span>
            </div>
            <div className="progress-wrap">
              <span className="progress-num">{s.progress}%</span>
              <div className="progress-bar"><div className="progress-fill" style={{ width: s.progress + '%' }} /></div>
            </div>
            <span className={'status-pill s-' + s.status}>
              <span className={'dot-st ' + s.status} />
              {STATUS_LABEL[s.status]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

window.ActivityFeed = ActivityFeed;
window.StudentList = StudentList;
