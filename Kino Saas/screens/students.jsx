// Öğrencilerim — grid + list view, filters, add modal
const { useState: useState_S } = React;

function StudentsPage({ onOpenStudent }) {
  const [view, setView] = useState_S('grid');
  const [filter, setFilter] = useState_S('all');
  const [q, setQ] = useState_S('');
  const [showAdd, setShowAdd] = useState_S(false);

  const counts = DATA.students.reduce((a, s) => ((a[s.status] = (a[s.status] || 0) + 1), a), {});
  let list = DATA.students;
  if (filter !== 'all') list = list.filter(s => s.status === filter);
  if (q) list = list.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="screen" data-screen-label="Öğrencilerim">
      <div className="page-head">
        <div className="page-title">
          <h1>Öğrencilerim</h1>
          <p>{DATA.students.length} öğrenci · {counts.risk || 0} riskli, {counts.warn || 0} ortalama, {counts.good || 0} iyi gidiyor</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline">
            <Ic.Filter width="14" height="14" /> Dışa aktar
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Ic.Plus width="14" height="14" /> Öğrenci Ekle
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="filter-tabs">
          {[
            ['all', 'Tümü', DATA.students.length, null],
            ['good', 'İyi', counts.good || 0, 'good'],
            ['warn', 'Ortalama', counts.warn || 0, 'warn'],
            ['risk', 'Riskli', counts.risk || 0, 'risk'],
          ].map(([k, l, c, dot]) => (
            <button key={k} className={'filter-tab' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>
              {dot && <span className={'dot-st ' + dot} />}
              {l}<span className="count">{c}</span>
            </button>
          ))}
        </div>
        <div className="toolbar-spacer" />
        <div className="search-inline">
          <Ic.Search width="14" height="14" className="search-icon" />
          <input placeholder="Öğrenci ara…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="view-toggle">
          <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} title="Kart">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>
          </button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} title="Liste">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="students-grid">
          {list.map(s => <StudentCard key={s.id} s={s} onOpen={() => onOpenStudent(s.id)} />)}
        </div>
      ) : (
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Öğrenci</th>
                <th>Sınıf</th>
                <th>Alan</th>
                <th>Son aktiflik</th>
                <th>Görev</th>
                <th>Durum</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map(s => (
                <tr key={s.id} onClick={() => onOpenStudent(s.id)}>
                  <td>
                    <div className="cell-user">
                      <UserAvatar name={s.name} size={32} />
                      <div>
                        <div className="cu-name">{s.name}</div>
                        <div className="cu-sub">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.grade}</td>
                  <td>{s.track}</td>
                  <td className="muted">{s.lastActive}</td>
                  <td>
                    <div className="cell-progress">
                      <span>{s.progress}%</span>
                      <div className="mini-bar"><div className={'mini-fill s-' + s.status} style={{ width: s.progress + '%' }} /></div>
                    </div>
                  </td>
                  <td><span className={'status-pill s-' + s.status}><span className={'dot-st ' + s.status} />{STATUS_SHORT[s.status]}</span></td>
                  <td><button className="row-more" onClick={e => e.stopPropagation()}><Ic.More width="14" height="14" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function StudentCard({ s, onOpen }) {
  return (
    <div className={'student-card s-' + s.status}>
      <button className="card-more" onClick={e => e.stopPropagation()} aria-label="Daha fazla">
        <Ic.More width="16" height="16" />
      </button>
      <div className="card-head">
        <UserAvatar name={s.name} size={52} />
        <div className="card-name-wrap">
          <div className="card-name">{s.name}</div>
          <div className="card-sub">{s.grade} · {s.track}</div>
        </div>
      </div>
      <div className="card-meta">
        <div>
          <div className="card-meta-l">Son giriş</div>
          <div className="card-meta-v">{s.lastActive}</div>
        </div>
        <div>
          <div className="card-meta-l">Streak</div>
          <div className="card-meta-v">{s.streak} gün</div>
        </div>
      </div>
      <div className="card-progress">
        <div className="card-progress-top">
          <span className="card-meta-l">Görev tamamlama</span>
          <span className="card-meta-v">{s.progress}%</span>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: s.progress + '%' }} /></div>
      </div>
      <div className="card-status">
        <span className={'status-pill s-' + s.status}><span className={'dot-st ' + s.status} />{STATUS_LABEL[s.status]}</span>
      </div>
      <div className="card-actions">
        <button className="btn btn-primary" onClick={onOpen}>Profili Aç</button>
        <button className="btn btn-ghost-bordered" title="Mesaj">
          <Ic.Chat width="14" height="14" />
        </button>
        <button className="btn btn-ghost-bordered" title="Düzenle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4l11-11-4-4L4 16z"/><path d="M14 5l4 4"/></svg>
        </button>
        <button className="btn btn-ghost-bordered btn-danger" title="Sil">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    </div>
  );
}

function AddStudentModal({ onClose }) {
  const [form, setForm] = useState_S({ name: '', email: '', phone: '', grade: '12. Sınıf', track: 'Sayısal' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h3>Yeni öğrenci ekle</h3>
            <p>Davet bağlantısı otomatik olarak öğrenciye e‑posta ile gönderilir.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Kapat"><Ic.X width="16" height="16" /></button>
        </header>
        <div className="modal-body">
          <div className="field">
            <label>Ad Soyad <span className="req">*</span></label>
            <input className="input" placeholder="Örn. Deniz Arslan" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>E‑posta <span className="req">*</span></label>
              <input className="input" type="email" placeholder="ogrenci@kino.app" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="field">
              <label>Telefon <span className="opt">opsiyonel</span></label>
              <input className="input" placeholder="+90 555 …" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Sınıf</label>
              <select className="input" value={form.grade} onChange={e => set('grade', e.target.value)}>
                <option>9. Sınıf</option>
                <option>10. Sınıf</option>
                <option>11. Sınıf</option>
                <option>12. Sınıf</option>
                <option>Mezun</option>
              </select>
            </div>
            <div className="field">
              <label>Alan</label>
              <select className="input" value={form.track} onChange={e => set('track', e.target.value)}>
                <option>Sayısal</option>
                <option>Eşit Ağırlık</option>
                <option>Sözel</option>
                <option>Dil</option>
              </select>
            </div>
          </div>
          <div className="hint">
            <Ic.Spark width="14" height="14" />
            <span>Öğrenci ilk girişinde otomatik profil sihirbazı çıkar; netlerini geçmişe dönük olarak da ekleyebilirsin.</span>
          </div>
        </div>
        <footer className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
          <button className="btn btn-primary" onClick={onClose}>
            <Ic.Check width="14" height="14" /> Kaydet & davet gönder
          </button>
        </footer>
      </div>
    </div>
  );
}

window.StudentsPage = StudentsPage;
