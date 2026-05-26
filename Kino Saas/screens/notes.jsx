// Koç Notları — private notes per student + motivasyon sender
const { useState: useState_N } = React;

const SEED_NOTES = {
  s1: [
    { id: 1, date: '23 May', tags: ['konu'], text: 'Türev konusunda eksik var, hafta sonu planına 2 saat geometri ekleyeceğim. Soru bankasından özetli anlatım çalışacak.' },
    { id: 2, date: '14 May', tags: ['paragraf'], text: 'Paragrafta kaydı azaldı, soru analizi yapalım — özellikle anlam soruları zayıf.' },
    { id: 3, date: '02 May', tags: ['motivasyon'], text: 'Veliyle görüştüm; motivasyon yüksek, sınav kaygısına eğileceğiz.' },
  ],
  s3: [
    { id: 1, date: '21 May', tags: ['motivasyon'], text: 'Motivasyonu düşük, kısa görüşme yaptık. Önümüzdeki hafta gevşek bir program deneyelim.' },
  ],
  s5: [
    { id: 1, date: '20 May', tags: ['risk'], text: 'Hiç giriş yapmıyor. Veli aramaya karar verdim.' },
    { id: 2, date: '12 May', tags: ['konu'], text: 'Matematikte temel eksikleri var, 9-10 sınıfa dönelim.' },
  ],
};

const TAG_COLOR = { konu: 'teal', motivasyon: 'amber', risk: 'rose', paragraf: 'indigo' };

function NotesPage({ embedded, studentId }) {
  const [active, setActive] = useState_N(studentId || 's1');
  const [notes, setNotes] = useState_N(SEED_NOTES);
  const [draft, setDraft] = useState_N('');
  const [tag, setTag] = useState_N('konu');
  const s = findStudent(active);
  const list = notes[active] || [];

  const addNote = () => {
    if (!draft.trim()) return;
    const today = new Date();
    const dateStr = today.getDate() + ' ' + ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][today.getMonth()];
    setNotes(n => ({ ...n, [active]: [{ id: Date.now(), date: dateStr, tags: [tag], text: draft }, ...(n[active] || [])] }));
    setDraft('');
  };

  return (
    <div className={'screen ' + (embedded ? 'embedded' : '')} data-screen-label="Koç Notları">
      {!embedded && (
        <div className="page-head">
          <div className="page-title">
            <h1>Koç Notları</h1>
            <p>Sadece sen görürsün · öğrencilere kapalı</p>
          </div>
          <div className="page-actions">
            <button className="btn btn-outline"><Ic.Spark width="14" height="14" /> Motivasyon Gönder</button>
          </div>
        </div>
      )}

      <div className="notes-shell">
        {!embedded && (
          <aside className="notes-list">
            <div className="notes-list-head">
              <Ic.Search width="14" height="14" className="search-icon" />
              <input placeholder="Öğrenci ara…" />
            </div>
            <div className="notes-list-body">
              {DATA.students.map(st => (
                <button key={st.id} className={'notes-item' + (active === st.id ? ' active' : '')} onClick={() => setActive(st.id)}>
                  <UserAvatar name={st.name} size={32} />
                  <div className="notes-item-body">
                    <span className="notes-item-name">{st.name}</span>
                    <span className="notes-item-sub">{(notes[st.id] || []).length} not</span>
                  </div>
                  <span className={'dot-st ' + st.status} />
                </button>
              ))}
            </div>
          </aside>
        )}

        <section className="notes-thread">
          {!embedded && (
            <header className="notes-head">
              <UserAvatar name={s.name} size={40} />
              <div>
                <div className="ct-name">{s.name}</div>
                <div className="ct-sub">{s.grade} · {s.track}</div>
              </div>
              <span className="locked-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                Yalnızca koç
              </span>
            </header>
          )}

          <div className="notes-composer">
            <textarea
              placeholder="Yeni not… (örn. Motivasyonu düştü, matematikte eksik var)"
              value={draft}
              onChange={e => setDraft(e.target.value)}
            />
            <div className="notes-composer-foot">
              <div className="notes-tags">
                {['konu', 'motivasyon', 'risk', 'paragraf'].map(t => (
                  <button key={t} className={'tag-chip tone-' + TAG_COLOR[t] + (tag === t ? ' active' : '')} onClick={() => setTag(t)}>
                    #{t}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary" onClick={addNote}><Ic.Check width="14" height="14" /> Kaydet</button>
            </div>
          </div>

          <div className="notes-feed">
            {list.length === 0 && <div className="chat-empty" style={{ padding: '40px 0' }}>Henüz not yok. Yukarıdan ilk notunu ekle.</div>}
            {list.map(n => (
              <article key={n.id} className="note-block">
                <header>
                  <span className="note-date">{n.date}</span>
                  <div className="note-tags">
                    {n.tags.map(t => <span key={t} className={'tag-chip static tone-' + TAG_COLOR[t]}>#{t}</span>)}
                  </div>
                  <button className="row-more"><Ic.More width="14" height="14" /></button>
                </header>
                <p>{n.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

window.NotesPage = NotesPage;
