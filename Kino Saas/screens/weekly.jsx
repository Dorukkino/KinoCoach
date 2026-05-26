// Haftalık Program — 7 columns × 10 rows editable grid
const { useState: useState_W } = React;

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const SEED = () => {
  const cells = Array.from({ length: 10 }, () => Array(7).fill(null));
  cells[0][0] = { title: 'TYT Matematik', sub: '40 soru', tone: 'teal', done: true };
  cells[0][1] = { title: 'Paragraf', sub: '20 soru', tone: 'amber', done: true };
  cells[1][0] = { title: 'Geometri', sub: '15 soru', tone: 'indigo', done: true };
  cells[1][2] = { title: 'AYT Fizik', sub: 'Konu: Optik', tone: 'rose', done: false };
  cells[2][1] = { title: 'TYT Türkçe', sub: '30 soru', tone: 'amber', done: true };
  cells[2][3] = { title: 'AYT Matematik', sub: '30 soru', tone: 'teal', done: false };
  cells[3][2] = { title: 'Biyoloji', sub: 'Konu tekrarı', tone: 'mint', done: false };
  cells[3][4] = { title: 'AYT Kimya', sub: '25 soru', tone: 'green', done: false };
  cells[4][0] = { title: 'TYT Matematik', sub: '40 soru', tone: 'teal', done: false };
  cells[4][5] = { title: 'Branş Denemesi', sub: 'Matematik', tone: 'sand', done: false };
  cells[5][3] = { title: 'Fizik', sub: '20 soru', tone: 'rose', done: false };
  cells[6][5] = { title: 'Genel Deneme', sub: 'AYT Sayısal', tone: 'sand', done: false };
  cells[7][6] = { title: 'Konu tekrarı', sub: 'Türev', tone: 'teal', done: false };
  return cells;
};

function WeeklyProgram({ embedded, role = 'coach' }) {
  const [cells, setCells] = useState_W(SEED);
  const [activeWeek, setActiveWeek] = useState_W('26 May — 1 Haz');
  const [editing, setEditing] = useState_W(null); // {row, col} or null
  const [draft, setDraft] = useState_W({ title: '', sub: '', tone: 'teal' });

  const openCell = (r, c) => {
    const cell = cells[r][c];
    setEditing({ r, c });
    setDraft(cell || { title: '', sub: '', tone: 'teal' });
  };
  const saveCell = () => {
    if (!editing) return;
    const next = cells.map(row => row.slice());
    next[editing.r][editing.c] = draft.title ? { ...draft, done: cells[editing.r][editing.c]?.done || false } : null;
    setCells(next);
    setEditing(null);
  };
  const removeCell = () => {
    const next = cells.map(row => row.slice());
    next[editing.r][editing.c] = null;
    setCells(next);
    setEditing(null);
  };
  const toggleDone = (r, c) => {
    if (role !== 'student') return;
    const next = cells.map(row => row.slice());
    if (next[r][c]) next[r][c] = { ...next[r][c], done: !next[r][c].done };
    setCells(next);
  };

  const totalTasks = cells.flat().filter(Boolean).length;
  const doneTasks = cells.flat().filter(c => c?.done).length;
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className={'screen ' + (embedded ? 'embedded' : '')} data-screen-label="Haftalık Program">
      {!embedded && (
        <div className="page-head">
          <div className="page-title">
            <h1>Haftalık Program</h1>
            <p>Düzenlenebilir 7 × 10 grid · {totalTasks} görev planlandı, %{pct} tamamlandı</p>
          </div>
          <div className="page-actions">
            <div className="week-nav">
              <button className="icon-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
              <span>{activeWeek}</span>
              <button className="icon-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg></button>
            </div>
            <button className="btn btn-outline">Geçmiş haftalar</button>
            {role === 'coach' && <button className="btn btn-primary"><Ic.Check width="14" height="14" /> Haftayı Kaydet</button>}
          </div>
        </div>
      )}

      <div className="weekly-wrap">
        <div className="weekly-progress">
          <div className="weekly-progress-l">
            <span className="weekly-progress-pct">{pct}%</span>
            <span className="weekly-progress-sub">{doneTasks} / {totalTasks} görev tamamlandı</span>
          </div>
          <div className="weekly-progress-bar"><div className="weekly-progress-fill" style={{ width: pct + '%' }} /></div>
        </div>

        <div className="weekly-grid">
          <div className="wg-corner">#</div>
          {DAYS.map((d, i) => (
            <div className="wg-head" key={i}>
              <span className="wg-head-long">{d}</span>
              <span className="wg-head-short">{DAYS_SHORT[i]}</span>
            </div>
          ))}
          {cells.map((row, r) => (
            <React.Fragment key={r}>
              <div className="wg-row-num">{r + 1}</div>
              {row.map((cell, c) => (
                <button
                  key={c}
                  className={'wg-cell' + (cell ? ' filled tone-' + cell.tone : '') + (cell?.done ? ' done' : '')}
                  onClick={() => role === 'coach' ? openCell(r, c) : toggleDone(r, c)}
                >
                  {cell ? (
                    <>
                      {role === 'student' && (
                        <span className={'check-mark' + (cell.done ? ' on' : '')}>
                          {cell.done && <Ic.Check width="10" height="10" />}
                        </span>
                      )}
                      <span className="wg-title">{cell.title}</span>
                      {cell.sub && <span className="wg-sub">{cell.sub}</span>}
                    </>
                  ) : (
                    role === 'coach' && <span className="wg-plus"><Ic.Plus width="12" height="12" /></span>
                  )}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {editing && (
        <div className="modal-bg" onClick={() => setEditing(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <header className="modal-head">
              <div>
                <h3>Görev {cells[editing.r][editing.c] ? 'düzenle' : 'ekle'}</h3>
                <p>{DAYS[editing.c]} · {editing.r + 1}. ders</p>
              </div>
              <button className="modal-close" onClick={() => setEditing(null)}><Ic.X width="16" height="16" /></button>
            </header>
            <div className="modal-body">
              <div className="field">
                <label>Ders / Görev</label>
                <input className="input" placeholder="Örn. TYT Matematik" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} autoFocus />
              </div>
              <div className="field">
                <label>Detay</label>
                <input className="input" placeholder="Örn. 30 soru" value={draft.sub} onChange={e => setDraft(d => ({ ...d, sub: e.target.value }))} />
              </div>
              <div className="field">
                <label>Renk</label>
                <div className="tone-row">
                  {['teal', 'amber', 'rose', 'green', 'indigo', 'mint', 'sand'].map(t => (
                    <button key={t} className={'tone-chip tone-' + t + (draft.tone === t ? ' active' : '')} onClick={() => setDraft(d => ({ ...d, tone: t }))} aria-label={t} />
                  ))}
                </div>
              </div>
            </div>
            <footer className="modal-foot">
              {cells[editing.r][editing.c]
                ? <button className="btn btn-ghost btn-danger" onClick={removeCell}>Sil</button>
                : <span style={{ flex: 1 }} />}
              <span style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Vazgeç</button>
              <button className="btn btn-primary" onClick={saveCell}>Kaydet</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

window.WeeklyProgram = WeeklyProgram;
