// Deneme Netleri — table + per‑subject line charts
const { useState: useState_T } = React;

const TRIAL_ROWS = [
  { date: '03 Mar', tr: 28.50, mat: 22.75, fen: 14.25, sos: 18.00 },
  { date: '17 Mar', tr: 30.00, mat: 24.50, fen: 15.50, sos: 17.50 },
  { date: '31 Mar', tr: 31.25, mat: 26.00, fen: 16.75, sos: 18.25 },
  { date: '14 Nis', tr: 32.50, mat: 27.25, fen: 17.25, sos: 19.00 },
  { date: '28 Nis', tr: 33.00, mat: 28.50, fen: 18.00, sos: 19.75 },
  { date: '12 May', tr: 34.25, mat: 30.75, fen: 19.25, sos: 20.25 },
  { date: '19 May', tr: 35.00, mat: 31.50, fen: 19.75, sos: 20.50 },
  { date: '24 May', tr: 36.50, mat: 33.25, fen: 20.50, sos: 21.00 },
];

const SUBJECTS = [
  { k: 'all', l: 'Toplam', color: 'oklch(0.55 0.07 180)', fill: 'oklch(0.7 0.08 180)' },
  { k: 'tr', l: 'Türkçe', color: 'oklch(0.6 0.12 80)', fill: 'oklch(0.78 0.12 80)' },
  { k: 'mat', l: 'Matematik', color: 'oklch(0.55 0.1 250)', fill: 'oklch(0.7 0.1 250)' },
  { k: 'fen', l: 'Fen', color: 'oklch(0.55 0.1 150)', fill: 'oklch(0.7 0.1 150)' },
  { k: 'sos', l: 'Sosyal', color: 'oklch(0.6 0.12 25)', fill: 'oklch(0.75 0.12 25)' },
];

function TrialScores({ embedded, role = 'coach' }) {
  const [subject, setSubject] = useState_T('all');
  const [showAdd, setShowAdd] = useState_T(false);

  const subjectData = subject === 'all'
    ? TRIAL_ROWS.map(r => +(r.tr + r.mat + r.fen + r.sos).toFixed(2))
    : TRIAL_ROWS.map(r => r[subject]);
  const sub = SUBJECTS.find(s => s.k === subject);
  const totalOf = r => +(r.tr + r.mat + r.fen + r.sos).toFixed(2);
  const lastScore = subjectData[subjectData.length - 1];
  const prevScore = subjectData[subjectData.length - 2];
  const delta = +(lastScore - prevScore).toFixed(2);

  return (
    <div className={'screen ' + (embedded ? 'embedded' : '')} data-screen-label="Deneme Netleri">
      {!embedded && (
        <div className="page-head">
          <div className="page-title">
            <h1>Deneme Netleri</h1>
            <p>{TRIAL_ROWS.length} deneme · son denemede toplam {totalOf(TRIAL_ROWS.at(-1))} net</p>
          </div>
          <div className="page-actions">
            <button className="btn btn-outline"><Ic.Filter width="14" height="14" /> Filtrele</button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Ic.Plus width="14" height="14" /> Deneme Ekle</button>
          </div>
        </div>
      )}

      <div className="panel">
        <header className="panel-head">
          <div className="panel-title">
            <h3>{sub.l} gelişimi</h3>
            <p>Son {TRIAL_ROWS.length} deneme</p>
          </div>
          <div className="tabs">
            {SUBJECTS.map(s => (
              <button key={s.k} className={'tab' + (subject === s.k ? ' active' : '')} onClick={() => setSubject(s.k)}>{s.l}</button>
            ))}
          </div>
        </header>
        <div className="panel-body" style={{ padding: '18px 22px 14px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Son sonuç</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 42, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {lastScore}
              <span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 6, fontFamily: 'var(--font)' }}>net</span>
            </span>
            <span className={'delta ' + (delta >= 0 ? 'up' : 'down')} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
              {delta >= 0 ? <Ic.Trend width="11" height="11" /> : <Ic.TrendDown width="11" height="11" />}
              {delta >= 0 ? '+' : ''}{delta} net
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 6 }}>geçen denemeye göre</span>
          </div>
          <div style={{ flex: 1 }}>
            <LineChart data={subjectData} labels={TRIAL_ROWS.map(r => r.date)} height={220} color={sub.color} fillColor={sub.fill} />
          </div>
        </div>
      </div>

      <div className="panel">
        <header className="panel-head">
          <div className="panel-title">
            <h3>Deneme listesi</h3>
            <p>Hücreye tıklayarak değer düzenle</p>
          </div>
        </header>
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Türkçe</th>
                <th>Matematik</th>
                <th>Fen</th>
                <th>Sosyal</th>
                <th>Toplam</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {TRIAL_ROWS.slice().reverse().map((r, i) => (
                <tr key={i}>
                  <td><b>{r.date}</b></td>
                  <td className="num">{r.tr.toFixed(2)}</td>
                  <td className="num">{r.mat.toFixed(2)}</td>
                  <td className="num">{r.fen.toFixed(2)}</td>
                  <td className="num">{r.sos.toFixed(2)}</td>
                  <td className="num num-strong">{totalOf(r).toFixed(2)}</td>
                  <td><button className="row-more"><Ic.More width="14" height="14" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="modal-bg" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <header className="modal-head">
              <div>
                <h3>Deneme net ekle</h3>
                <p>Yeni deneme sonuçlarını gir</p>
              </div>
              <button className="modal-close" onClick={() => setShowAdd(false)}><Ic.X width="16" height="16" /></button>
            </header>
            <div className="modal-body">
              <div className="field-row">
                <div className="field">
                  <label>Tarih</label>
                  <input className="input" type="date" defaultValue="2026-05-31" />
                </div>
                <div className="field">
                  <label>Deneme adı</label>
                  <input className="input" placeholder="3D TYT Deneme 9" />
                </div>
              </div>
              <div className="field-row">
                <div className="field"><label>Türkçe</label><input className="input" type="number" step="0.25" placeholder="0.00" /></div>
                <div className="field"><label>Matematik</label><input className="input" type="number" step="0.25" placeholder="0.00" /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>Fen</label><input className="input" type="number" step="0.25" placeholder="0.00" /></div>
                <div className="field"><label>Sosyal</label><input className="input" type="number" step="0.25" placeholder="0.00" /></div>
              </div>
            </div>
            <footer className="modal-foot">
              <span style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Vazgeç</button>
              <button className="btn btn-primary" onClick={() => setShowAdd(false)}><Ic.Check width="14" height="14" /> Kaydet</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

window.TrialScores = TrialScores;
