// Chat — coach view shows student list + thread; student view shows only coach thread
const { useState: useState_C, useRef: useRef_C, useEffect: useEffect_C } = React;

const SEED_THREADS = {
  s1: [
    { from: 'student', text: 'Hocam matematikte türev konusunda zorlanıyorum, ek kaynak önerir misiniz?', time: '09:14' },
    { from: 'coach', text: 'Tabii, sana özel olarak Limit ve Türev fasikülünü göndereyim 📚', time: '09:18' },
    { from: 'coach', text: '', file: 'turev-ozet.pdf', size: '2.4 MB', time: '09:18' },
    { from: 'student', text: 'Çok teşekkürler, bugün başlıyorum!', time: '09:20', read: true },
  ],
  s2: [
    { from: 'coach', text: 'AYT denemende kişisel rekor 🔥 Devam!', time: 'Dün 21:14' },
    { from: 'student', text: 'Sağolun hocam ✨', time: 'Dün 21:16', read: true },
  ],
  s3: [
    { from: 'student', text: 'Bu haftaki paragraf görevi biraz fazla olmadı mı?', time: '08:42' },
    { from: 'coach', text: 'Haklısın, 30’a indirelim. Yarın bakalım birlikte.', time: '08:50' },
  ],
  s4: [{ from: 'student', text: 'İyi geceler hocam', time: 'Dün 23:10' }],
  s5: [{ from: 'coach', text: 'Mehmet, son 4 gündür hiç giriş yapmadın. Her şey yolunda mı?', time: '2 gün önce' }],
  s6: [{ from: 'coach', text: 'Burak, haftalık programını birlikte güncelleyelim mi?', time: '3 gün önce' }],
  s7: [{ from: 'student', text: 'Hocam fizik dersi sorularını gönderiyorum', time: '10:02' }],
  s8: [{ from: 'student', text: '👍', time: 'Dün' }],
};

const PREVIEW = {
  s1: 'Çok teşekkürler, bugün başlıyorum!',
  s2: 'Sağolun hocam ✨',
  s3: 'Bu haftaki paragraf görevi…',
  s4: 'İyi geceler hocam',
  s5: 'Mehmet, son 4 gündür hiç…',
  s6: 'Burak, haftalık programını…',
  s7: 'Hocam fizik dersi sorularını…',
  s8: '👍',
};

function ChatPage({ embedded, initialStudentId, role = 'coach' }) {
  const [active, setActive] = useState_C(initialStudentId || 's1');
  const [draft, setDraft] = useState_C('');
  const [threads, setThreads] = useState_C(SEED_THREADS);
  const [search, setSearch] = useState_C('');
  const scrollRef = useRef_C(null);

  const s = findStudent(active);
  const msgs = threads[active] || [];
  useEffect_C(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active, msgs.length]);

  const send = () => {
    if (!draft.trim()) return;
    const now = new Date();
    const t = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    setThreads(th => ({ ...th, [active]: [...(th[active] || []), { from: role, text: draft, time: t }] }));
    setDraft('');
  };

  const filtered = DATA.students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={'screen chat-screen ' + (embedded ? 'embedded' : '')} data-screen-label="Chat">
      {!embedded && role === 'coach' && (
        <div className="page-head">
          <div className="page-title">
            <h1>Chat</h1>
            <p>Öğrencilerinle gerçek zamanlı iletişim</p>
          </div>
        </div>
      )}

      <div className="chat-shell">
        {role === 'coach' && (
          <aside className="chat-list">
            <div className="chat-list-head">
              <Ic.Search width="14" height="14" className="search-icon" />
              <input placeholder="Öğrenci ara…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="chat-list-body">
              {filtered.map(st => {
                const lastTime = (threads[st.id] || []).at(-1)?.time || '';
                const unread = ['s3', 's7'].includes(st.id) && active !== st.id ? 1 : 0;
                return (
                  <button key={st.id} className={'chat-item' + (active === st.id ? ' active' : '')} onClick={() => setActive(st.id)}>
                    <div style={{ position: 'relative' }}>
                      <UserAvatar name={st.name} size={38} />
                      <span className={'presence ' + (st.status === 'risk' ? 'off' : 'on')} />
                    </div>
                    <div className="chat-item-body">
                      <div className="chat-item-top">
                        <span className="chat-item-name">{st.name}</span>
                        <span className="chat-item-time">{lastTime}</span>
                      </div>
                      <div className="chat-item-bottom">
                        <span className="chat-item-preview">{PREVIEW[st.id] || '—'}</span>
                        {unread > 0 && <span className="chat-unread">{unread}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        <section className="chat-thread">
          <header className="chat-thread-head">
            <UserAvatar name={role === 'student' ? 'Emre Soysal' : s.name} size={36} />
            <div>
              <div className="ct-name">{role === 'student' ? 'Emre Soysal' : s.name}</div>
              <div className="ct-sub">
                <span className="presence on inline" /> Çevrimiçi {role === 'coach' && '· ' + s.track}
              </div>
            </div>
            <div className="chat-head-actions">
              <button className="icon-btn" title="Sesli arama"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg></button>
              <button className="icon-btn" title="Görüntülü arama"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg></button>
              <button className="icon-btn" title="Daha fazla"><Ic.More width="15" height="15" /></button>
            </div>
          </header>

          <div className="chat-day-sep"><span>Bugün</span></div>

          <div className="chat-messages" ref={scrollRef}>
            {msgs.map((m, i) => {
              const isMe = m.from === role;
              return (
                <div key={i} className={'chat-msg ' + (isMe ? 'me' : 'them')}>
                  {!isMe && <UserAvatar name={role === 'student' ? 'Emre Soysal' : s.name} size={28} />}
                  <div className={'chat-bubble ' + (isMe ? 'me' : 'them')}>
                    {m.file ? (
                      <div className="chat-file">
                        <span className="chat-file-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v4h5"/></svg></span>
                        <div>
                          <div className="chat-file-name">{m.file}</div>
                          <div className="chat-file-size">{m.size}</div>
                        </div>
                        <button className="chat-file-dl">İndir</button>
                      </div>
                    ) : (
                      <span>{m.text}</span>
                    )}
                    <span className="chat-time">{m.time}{isMe && <Ic.Check width="11" height="11" style={{ marginLeft: 4, opacity: 0.7 }} />}</span>
                  </div>
                </div>
              );
            })}
            {msgs.length === 0 && <div className="chat-empty">İlk mesajını gönder ✨</div>}
          </div>

          <footer className="chat-composer">
            <button className="icon-btn" title="Ek dosya">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 0 1 5 5L10 19"/></svg>
            </button>
            <button className="icon-btn" title="Fotoğraf">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m3 17 5-4 4 3 4-5 5 6"/></svg>
            </button>
            <input
              placeholder="Mesaj yaz…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button className="icon-btn" title="Emoji">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 10v.01M15 10v.01M8.5 14.5a4.5 4.5 0 0 0 7 0"/></svg>
            </button>
            <button className="chat-send" onClick={send} aria-label="Gönder">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 14-7-5 16-3-6z"/></svg>
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}

window.ChatPage = ChatPage;
