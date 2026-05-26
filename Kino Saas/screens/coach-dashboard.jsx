// Coach Dashboard — extracted screen
const CoachDashboard = ({ feedFilter, setFeedFilter, studentFilter, setStudentFilter, nudgeOpen, setNudgeOpen, showNudge }) => {
  const today = new Date('2026-05-25').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="screen" data-screen-label="Coach Dashboard">
      <div className="greeting-row">
        <div className="greeting">
          <h1>Günaydın Emre, <em>bugün 6 öğrencin nete giriyor.</em></h1>
          <p>Koçluk panelinde son 24 saatte 18 hareket var. Aşağıda özetini gör.</p>
        </div>
        <span className="date-pill">
          <span className="pulse" />
          {today.charAt(0).toUpperCase() + today.slice(1)}
        </span>
      </div>

      <StatsRow />

      {showNudge && nudgeOpen && (
        <div className="nudge" data-screen-label="AI Önerisi">
          <div className="nudge-ico"><Ic.Spark width="18" height="18" /></div>
          <div className="nudge-body">
            <div className="nudge-title">2 öğrencin son 5 günde hiç net girmedi</div>
            <div className="nudge-text">Mehmet Aksoy ve Burak Şahin için bireysel mesaj taslağı hazırladık — incelemek ister misin?</div>
          </div>
          <button className="nudge-action">Taslakları gör</button>
          <button className="nudge-close" onClick={() => setNudgeOpen(false)} aria-label="Kapat">
            <Ic.X width="14" height="14" />
          </button>
        </div>
      )}

      <div className="split">
        <ActivityFeed filter={feedFilter} setFilter={setFeedFilter} />
        <StudentList filter={studentFilter} setFilter={setStudentFilter} />
      </div>
    </div>
  );
};

window.CoachDashboard = CoachDashboard;
