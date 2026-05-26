// Soru Çözüm Listesi — student-only entry, D/Y/B per subject per day
const { useState: useState_L } = React;

const LESSON_SUBJECTS = ['Matematik', 'Türkçe', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'Edebiyat'];

// Seed data — each cell is { d, y, b } or null
const QZ_SEED = () => {
  const empty = () => Array.from({ length: 10 }, () => Array(7).fill(null));
  const m = empty();
  const set = (r, c, d, y, b) => { m[r][c] = { d, y, b }; };
  set(0, 0, 32, 4, 4); set(0, 1, 28, 5, 2); set(0, 3, 24, 4, 2); set(0, 4, 30, 6, 4); set(0, 5, 18, 2, null);
  set(1, 0, 18, 3, 1); set(1, 1, 22, 4, 4); set(1, 2, 20, 3, 2); set(1, 4, 24, 4, 2); set(1, 5, 21, 3, 2);
  set(2, 0, 12, 2, 1); set(2, 2, 15, 3, 0); set(2, 3, 14, 2, 0); set(2, 5, 17, 1, 2);
  set(3, 1, 16, 4, 0); set(3, 2, 14, 5, 1); set(3, 3, 18, 3, 1); set(3, 4, 15, 2, 1); set(3, 6, 20, 3, 2);
  set(4, 0, 13, 2, 1); set(4, 2, 16, 3, 1); set(4, 4, 18, 2, 0);
  set(5, 1, 14, 3, 1); set(5, 3, 16, 4, 0); set(5, 5, 20, 3, 1);
  set(6, 0, 10, 1, 1); set(6, 2, 12, 2, 0); set(6, 5, 14, 2, 1);
  set(7, 0, 8, 1, 1); set(7, 1, 10, 1, 1); set(7, 4, 12, 1, 1); set(7, 6, 8, 0, 0);
  set(8, 2, 10, 2, 0); set(8, 4, 9, 1, 1);
  set(9, 1, 8, 1, 0); set(9, 3, 10, 2, 1); set(9, 6, 12, 2, 1);
  return m;
};

function LessonScores({ embedded, role = 'student', readOnly }) {
  const isReadOnly = readOnly || role === 'coach';
  const [cells, setCells] = useState_L(QZ_SEED);

  const totals = cells.flat().reduce((a, c) => {
    if (c) { a.d += c.d || 0; a.y += c.y || 0; a.b += c.b || 0; }
    return a;
  }, { d: 0, y: 0, b: 0 });
  const totalSoru = totals.d + totals.y + totals.b;
  const netCalc = totals.d - (totals.y / 4);
  const succ = totalSoru ? Math.round((totals.d / totalSoru) * 100) : 0;

  const edit = (r, c, k, v) => {
    if (isReadOnly) return;
    const next = cells.map(row => row.slice());
    const cur = next[r][c] || { d: null, y: null, b: null };
    const n = v === '' ? null : Math.max(0, Number(v) || 0);
    const updated = { ...cur, [k]: n };
    // If all null, store as null
    next[r][c] = (updated.d == null && updated.y == null && updated.b == null) ? null : updated;
    setCells(next);
  };

  const rowSum = (r) => cells[r].reduce((a, c) => a + ((c?.d || 0) + (c?.y || 0) + (c?.b || 0)), 0);
  const dayTotals = (col) => cells.reduce((a, row) => {
    const c = row[col];
    if (c) { a.d += c.d || 0; a.y += c.y || 0; a.b += c.b || 0; }
    return a;
  }, { d: 0, y: 0, b: 0 });

  return (
    <div className={'screen ' + (embedded ? 'embedded' : '')} data-screen-label="Soru Çözüm Listesi">
      {!embedded && (
        <div className="page-head">
          <div className="page-title">
            <h1>{role === 'coach' ? 'Soru Çözüm Listesi' : 'Soru Çözüm Listem'}</h1>
            <p>
              {role === 'coach'
                ? 'Öğrencinin çözdüğü soruların doğru/yanlış/boş dağılımı (salt okunur)'
                : 'Her ders için günlük çözdüğün soruları Doğru / Yanlış / Boş olarak gir'}
            </p>
          </div>
          <div className="page-actions">
            <div className="week-nav">
              <button className="icon-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
              <span>26 May — 1 Haz</span>
              <button className="icon-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg></button>
            </div>
            {!isReadOnly && <button className="btn btn-primary"><Ic.Check width="14" height="14" /> Haftayı Kaydet</button>}
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div className="qz-summary">
        <div className="qz-sum-card">
          <span className="qz-sum-l">Toplam Soru</span>
          <span className="qz-sum-v">{totalSoru}</span>
        </div>
        <div className="qz-sum-card">
          <span className="qz-sum-l"><span className="qz-dot d" /> Doğru</span>
          <span className="qz-sum-v">{totals.d}</span>
        </div>
        <div className="qz-sum-card">
          <span className="qz-sum-l"><span className="qz-dot y" /> Yanlış</span>
          <span className="qz-sum-v">{totals.y}</span>
        </div>
        <div className="qz-sum-card">
          <span className="qz-sum-l"><span className="qz-dot b" /> Boş</span>
          <span className="qz-sum-v">{totals.b}</span>
        </div>
        <div className="qz-sum-card accent">
          <span className="qz-sum-l">Net</span>
          <span className="qz-sum-v">{netCalc.toFixed(2)}</span>
          <span className="qz-sum-sub">başarı %{succ}</span>
        </div>
      </div>

      <div className="panel">
        <header className="panel-head">
          <div className="panel-title">
            <h3>{role === 'student' ? 'Bu haftaki soru çözümlerin' : 'Bu haftaki soru çözümleri'}</h3>
            <p>{isReadOnly ? 'Salt okunur — düzenleme öğrenci tarafındadır' : 'Hücrelere D / Y / B sayılarını gir, otomatik toplanır'}</p>
          </div>
          <div className="legend" style={{ borderBottom: 'none', padding: 0, marginBottom: 0 }}>
            <span className="legend-item"><span className="qz-dot d" /> Doğru</span>
            <span className="legend-item"><span className="qz-dot y" /> Yanlış</span>
            <span className="legend-item"><span className="qz-dot b" /> Boş</span>
          </div>
        </header>
        <div className="panel-body" style={{ padding: '12px 16px 16px', overflowX: 'auto' }}>
          <table className="qz-grid">
            <thead>
              <tr>
                <th className="qz-head-sub">Ders</th>
                {DAYS.map((d, i) => (
                  <th key={i}>
                    <span className="wg-head-long">{d}</span>
                    <span className="wg-head-short">{DAYS_SHORT[i]}</span>
                  </th>
                ))}
                <th className="qz-head-total">Top.</th>
              </tr>
            </thead>
            <tbody>
              {LESSON_SUBJECTS.map((subj, r) => (
                <tr key={r}>
                  <td className="qz-subj">{subj}</td>
                  {cells[r].map((cell, c) => {
                    const tone = cell ? (cell.d != null && cell.d >= 20 ? 'good' : cell.d != null && cell.d >= 10 ? 'warn' : cell.d != null ? 'risk' : '') : '';
                    return (
                      <td key={c} className={'qz-cell ' + tone + (isReadOnly ? ' ro' : '')}>
                        <div className="qz-row">
                          <span className="qz-tag d">D</span>
                          <input
                            inputMode="numeric"
                            value={cell?.d == null ? '' : cell.d}
                            onChange={e => edit(r, c, 'd', e.target.value)}
                            placeholder="—"
                            disabled={isReadOnly}
                          />
                        </div>
                        <div className="qz-row">
                          <span className="qz-tag y">Y</span>
                          <input
                            inputMode="numeric"
                            value={cell?.y == null ? '' : cell.y}
                            onChange={e => edit(r, c, 'y', e.target.value)}
                            placeholder="—"
                            disabled={isReadOnly}
                          />
                        </div>
                        <div className="qz-row">
                          <span className="qz-tag b">B</span>
                          <input
                            inputMode="numeric"
                            value={cell?.b == null ? '' : cell.b}
                            onChange={e => edit(r, c, 'b', e.target.value)}
                            placeholder="—"
                            disabled={isReadOnly}
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td className="qz-row-total"><b>{rowSum(r)}</b></td>
                </tr>
              ))}
              <tr className="qz-foot">
                <td>Günlük</td>
                {Array.from({ length: 7 }).map((_, c) => {
                  const t = dayTotals(c);
                  return (
                    <td key={c}>
                      <div className="qz-foot-line"><span className="qz-tag d">D</span>{t.d}</div>
                      <div className="qz-foot-line"><span className="qz-tag y">Y</span>{t.y}</div>
                      <div className="qz-foot-line"><span className="qz-tag b">B</span>{t.b}</div>
                    </td>
                  );
                })}
                <td className="qz-grand"><b>{totalSoru}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {isReadOnly && role === 'coach' && (
        <div className="hint" style={{ alignSelf: 'flex-start' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
          <span>Bu liste yalnızca öğrenci tarafından düzenlenebilir. Sen yalnızca görüntüleyebilirsin.</span>
        </div>
      )}
    </div>
  );
}

window.LessonScores = LessonScores;
