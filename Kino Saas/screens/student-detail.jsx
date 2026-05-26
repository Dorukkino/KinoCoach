// Öğrenci Detay — tabs: Overview, Weekly, Trials, Lessons, Chat, Notes
const { useState: useState_SD } = React;

function StudentDetail({ studentId, onBack }) {
  const s = findStudent(studentId);
  const [tab, setTab] = useState_SD('overview');
  const tabs = [
    ['overview', 'Genel Bakış'],
    ['weekly', 'Haftalık Program'],
    ['trials', 'Deneme Netleri'],
    ['lessons', 'Soru Çözüm Listesi'],
    ['notes', 'Koç Notları'],
  ];
  return (
    <div className="screen" data-screen-label="Öğrenci Detay">
      <button className="back-link" onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Öğrencilerim
      </button>

      <header className="profile-head">
        <UserAvatar name={s.name} size={72} />
        <div className="profile-meta">
          <div className="profile-name-row">
            <h1>{s.name}</h1>
            <span className={'status-pill s-' + s.status}><span className={'dot-st ' + s.status} />{STATUS_LABEL[s.status]}</span>
          </div>
          <div className="profile-sub">
            <span>{s.grade}</span><span className="sep" />
            <span>{s.track}</span><span className="sep" />
            <span>{s.school}</span><span className="sep" />
            <span className="muted">Son aktif: {s.lastActive}</span>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn btn-outline"><Ic.Chat width="14" height="14" /> Mesaj</button>
          <button className="btn btn-outline"><Ic.Spark width="14" height="14" /> Motivasyon</button>
          <button className="btn btn-primary"><Ic.Plus width="14" height="14" /> Görev Ata</button>
        </div>
      </header>

      <div className="profile-kpis">
        <div className="kpi">
          <span className="kpi-l">Görev tamamlama</span>
          <span className="kpi-v">{s.progress}<span className="u">%</span></span>
          <div className="mini-bar"><div className={'mini-fill s-' + s.status} style={{ width: s.progress + '%' }} /></div>
        </div>
        <div className="kpi">
          <span className="kpi-l">Son TYT Net</span>
          <span className="kpi-v">{s.avgNet}</span>
          <span className="kpi-d up">+2.4 ↑</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Streak</span>
          <span className="kpi-v">{s.streak}<span className="u">gün</span></span>
          <span className="kpi-d muted">son giriş {s.lastActive}</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Bu hafta görev</span>
          <span className="kpi-v">{s.tasksDone}<span className="u">/ {s.tasksTotal}</span></span>
          <span className="kpi-d muted">{s.tasksTotal - s.tasksDone} kaldı</span>
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map(([k, l]) => (
          <button key={k} className={'tab-btn' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="tab-content">
        {tab === 'overview' && <OverviewTab s={s} />}
        {tab === 'weekly' && <WeeklyEmbed studentName={s.name} />}
        {tab === 'trials' && <TrialsEmbed studentName={s.name} />}
        {tab === 'lessons' && <LessonsEmbed studentName={s.name} />}
        {tab === 'notes' && <NotesEmbed s={s} />}
      </div>
    </div>
  );
}

function OverviewTab({ s }) {
  return (
    <div className="overview-grid">
      <div className="panel">
        <header className="panel-head">
          <div className="panel-title">
            <h3>AYT Matematik gelişimi</h3>
            <p>Son 8 hafta · ortalama net</p>
          </div>
        </header>
        <div className="panel-body">
          <LineChart
            data={[28, 32, 30, 34, 36, 38, 41, 44]}
            labels={['1', '2', '3', '4', '5', '6', '7', '8']}
            height={220}
          />
        </div>
      </div>
      <div className="panel">
        <header className="panel-head">
          <div className="panel-title">
            <h3>Bu haftaki görevler</h3>
            <p>{s.tasksDone}/{s.tasksTotal} tamamlandı</p>
          </div>
        </header>
        <div className="panel-body" style={{ padding: 0 }}>
          {[
            { d: 'Pzt', t: 'TYT Matematik · 40 soru', done: true },
            { d: 'Pzt', t: 'Paragraf · 20 soru', done: true },
            { d: 'Sal', t: 'Geometri · 30 soru', done: true },
            { d: 'Çar', t: 'Fizik konu tekrarı', done: true },
            { d: 'Per', t: 'AYT Matematik · 30 soru', done: false },
            { d: 'Cum', t: 'Branş denemesi', done: false },
            { d: 'Cmt', t: 'Genel deneme', done: false },
          ].map((r, i) => (
            <div key={i} className="task-row">
              <span className={'check-mark' + (r.done ? ' on' : '')}>
                {r.done && <Ic.Check width="11" height="11" />}
              </span>
              <span className="task-day">{r.d}</span>
              <span className={'task-text' + (r.done ? ' done' : '')}>{r.t}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <header className="panel-head">
          <div className="panel-title">
            <h3>Koç notları</h3>
            <p>Bu notlar yalnızca koç paneline görünür</p>
          </div>
          <button className="btn btn-ghost"><Ic.Plus width="14" height="14" /> Yeni not</button>
        </header>
        <div className="panel-body" style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          <div className="note-card">
            <div className="note-date">23 Mayıs</div>
            <p>Geometri konusunda eksik var, hafta sonu çalışma planına 2 saat ekleyeceğim.</p>
          </div>
          <div className="note-card">
            <div className="note-date">19 Mayıs</div>
            <p>Motivasyonu düşük görünüyor. Velisiyle görüşülmesi gerekebilir.</p>
          </div>
          <div className="note-card">
            <div className="note-date">14 Mayıs</div>
            <p>Paragrafta kaydı azaldı, soru analizi yapalım.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Embedded views (read-only summary) for tabs
const WeeklyEmbed = ({ studentName }) => <WeeklyProgram embedded studentName={studentName} />;
const TrialsEmbed = ({ studentName }) => <TrialScores embedded studentName={studentName} />;
const LessonsEmbed = ({ studentName }) => <LessonScores embedded studentName={studentName} readOnly />;
const NotesEmbed = ({ s }) => <NotesPage embedded studentId={s.id} />;

window.StudentDetail = StudentDetail;
