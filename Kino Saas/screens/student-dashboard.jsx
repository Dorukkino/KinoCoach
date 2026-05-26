// Student Dashboard — today's tasks, completion %, last trial, coach motivation
const { useState: useState_SD2 } = React;

const TODAY_TASKS = [
  { id: 1, subject: 'Paragraf', sub: '20 soru · TYT Türkçe', done: true },
  { id: 2, subject: 'TYT Matematik', sub: '40 soru', done: true },
  { id: 3, subject: 'Geometri', sub: '15 soru', done: false },
  { id: 4, subject: 'AYT Fizik', sub: 'Konu: Optik', done: false },
  { id: 5, subject: 'Branş Denemesi', sub: 'Matematik · 1 saat', done: false },
];

function StudentDashboard() {
  const [tasks, setTasks] = useState_SD2(TODAY_TASKS);
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = Math.round((done / total) * 100);
  const toggle = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <div className="screen" data-screen-label="Student Dashboard">
      <div className="greeting-row">
        <div className="greeting">
          <h1>Selam Mira, <em>bugün 5 görevin var.</em></h1>
          <p>Streak 7 günde · son denemen bir önceki haftaya göre +2.4 net.</p>
        </div>
        <span className="date-pill">
          <span className="pulse" />
          Pazartesi · 25 Mayıs
        </span>
      </div>

      {/* Motivation card */}
      <div className="motivation-card" data-screen-label="Motivasyon Mesajı">
        <div className="motiv-side">
          <UserAvatar name="Emre Soysal" size={42} />
          <div>
            <div className="motiv-from">Emre koçundan mesaj var</div>
            <div className="motiv-time">2 saat önce</div>
          </div>
        </div>
        <div className="motiv-body">
          <q>Bugün çok iyi gidiyorsun 🔥 Geçen haftaya göre paragrafta gelişim net. Aynı tempoda devam, sonraki denemede konu hakim olduğun bölümlere ağırlık verelim.</q>
        </div>
      </div>

      {/* KPI strip */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-head">
            <span className="stat-label">Bugünkü görevler</span>
            <div className="stat-ico teal"><Ic.Check width="16" height="16" /></div>
          </div>
          <div className="stat-value">{done}<span className="unit">/ {total}</span></div>
          <div className="stat-foot">
            <span className={'delta ' + (pct >= 80 ? 'up' : 'flat')}>{pct}%</span>
            <span className="stat-sub">tamamlandı</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <span className="stat-label">Bu hafta görev</span>
            <div className="stat-ico green"><Ic.Trend width="16" height="16" /></div>
          </div>
          <div className="stat-value">42<span className="unit">/ 56</span></div>
          <div className="stat-foot">
            <span className="delta up"><Ic.Trend width="11" height="11" />75%</span>
            <span className="stat-sub">geçen hafta 68%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <span className="stat-label">Son TYT Net</span>
            <div className="stat-ico amber"><Ic.Trial width="16" height="16" /></div>
          </div>
          <div className="stat-value">96.5</div>
          <div className="stat-foot">
            <span className="delta up"><Ic.Trend width="11" height="11" />+2.4</span>
            <span className="stat-sub">kişisel rekor</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-head">
            <span className="stat-label">Streak</span>
            <div className="stat-ico rose"><Ic.Spark width="16" height="16" /></div>
          </div>
          <div className="stat-value">14<span className="unit">gün</span></div>
          <div className="stat-foot">
            <span className="delta flat">7 → 14</span>
            <span className="stat-sub">kesintisiz</span>
          </div>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <header className="panel-head">
            <div className="panel-title">
              <h3>Bugünkü görevler</h3>
              <p>İşaretledikçe koçun otomatik bilgilenir</p>
            </div>
            <span className="status-pill s-good"><span className="dot-st good" />{done}/{total} tamam</span>
          </header>
          <div className="panel-body" style={{ padding: 0 }}>
            {tasks.map(t => (
              <button key={t.id} className={'task-big' + (t.done ? ' done' : '')} onClick={() => toggle(t.id)}>
                <span className={'check-mark lg' + (t.done ? ' on' : '')}>
                  {t.done && <Ic.Check width="13" height="13" />}
                </span>
                <div className="task-big-body">
                  <span className="task-big-title">{t.subject}</span>
                  <span className="task-big-sub">{t.sub}</span>
                </div>
                <span className="task-big-est">~45 dk</span>
              </button>
            ))}
          </div>
          <div className="panel-foot-progress">
            <div className="weekly-progress-bar"><div className="weekly-progress-fill" style={{ width: pct + '%' }} /></div>
            <span>{pct}% bugün tamamlandı</span>
          </div>
        </section>

        <section className="panel">
          <header className="panel-head">
            <div className="panel-title">
              <h3>Net gelişimin</h3>
              <p>Son 8 deneme · toplam net</p>
            </div>
          </header>
          <div className="panel-body" style={{ padding: '16px 18px' }}>
            <LineChart
              data={[83.5, 87.0, 92.25, 95.75, 98.5, 105.0, 106.75, 111.25]}
              labels={['#1','#2','#3','#4','#5','#6','#7','#8']}
              height={200}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

window.StudentDashboard = StudentDashboard;
