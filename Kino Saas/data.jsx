// Shared dataset across screens
const DATA = {
  students: [
    { id: 's1', name: 'Ahmet Yılmaz', grade: '12. Sınıf', track: 'Sayısal', status: 'good', progress: 92, last: 'TYT 96.5', lastActive: '2 dk önce', email: 'ahmet.yilmaz@kino.app', phone: '+90 532 000 11 22', joined: '2025-09-12', school: 'Atatürk Anadolu Lisesi', tasksDone: 56, tasksTotal: 60, avgNet: 96.5, streak: 14 },
    { id: 's2', name: 'Zeynep Korkmaz', grade: '12. Sınıf', track: 'Sayısal', status: 'good', progress: 88, last: 'AYT 78.25', lastActive: '24 dk önce', email: 'zeynep.k@kino.app', phone: '+90 555 000 22 33', joined: '2025-09-08', school: 'Kabataş Erkek Lisesi', tasksDone: 53, tasksTotal: 60, avgNet: 78.25, streak: 9 },
    { id: 's3', name: 'Ayşe Demir', grade: '11. Sınıf', track: 'Eşit Ağırlık', status: 'warn', progress: 64, last: 'TYT 71.0', lastActive: '3 sa önce', email: 'ayse.d@kino.app', phone: '+90 530 000 33 44', joined: '2025-10-02', school: 'Galatasaray Lisesi', tasksDone: 38, tasksTotal: 60, avgNet: 71.0, streak: 3 },
    { id: 's4', name: 'Selin Aydın', grade: '12. Sınıf', track: 'Sözel‑Eş. A.', status: 'warn', progress: 58, last: 'TYT 68.75', lastActive: '6 sa önce', email: 'selin.a@kino.app', phone: '+90 533 000 44 55', joined: '2025-09-21', school: 'Cağaloğlu Anadolu Lisesi', tasksDone: 35, tasksTotal: 60, avgNet: 68.75, streak: 4 },
    { id: 's5', name: 'Mehmet Aksoy', grade: '12. Sınıf', track: 'Sayısal', status: 'risk', progress: 34, last: '4 gün önce', lastActive: '4 gün önce', email: 'mehmet.a@kino.app', phone: '+90 532 555 66 77', joined: '2025-09-05', school: 'Pertevniyal Lisesi', tasksDone: 20, tasksTotal: 60, avgNet: 52.4, streak: 0 },
    { id: 's6', name: 'Burak Şahin', grade: '11. Sınıf', track: 'Sayısal', status: 'risk', progress: 28, last: '6 gün önce', lastActive: '6 gün önce', email: 'burak.s@kino.app', phone: '+90 555 888 99 00', joined: '2025-10-14', school: 'İstanbul Anadolu Lisesi', tasksDone: 17, tasksTotal: 60, avgNet: 48.6, streak: 0 },
    { id: 's7', name: 'Elif Karaca', grade: '12. Sınıf', track: 'Sayısal', status: 'good', progress: 84, last: 'AYT 72.0', lastActive: '1 sa önce', email: 'elif.k@kino.app', phone: '+90 543 100 22 33', joined: '2025-09-19', school: 'Beyoğlu Anadolu Lisesi', tasksDone: 50, tasksTotal: 60, avgNet: 72.0, streak: 11 },
    { id: 's8', name: 'Kerem Polat', grade: '11. Sınıf', track: 'Eşit Ağırlık', status: 'warn', progress: 52, last: 'TYT 64.25', lastActive: '12 sa önce', email: 'kerem.p@kino.app', phone: '+90 544 333 44 55', joined: '2025-10-01', school: 'Vefa Lisesi', tasksDone: 31, tasksTotal: 60, avgNet: 64.25, streak: 2 },
  ],
};

const COURSE_OPTIONS = [
  { code: 'TYT-MAT', name: 'TYT Matematik', tone: 'teal' },
  { code: 'AYT-MAT', name: 'AYT Matematik', tone: 'teal' },
  { code: 'TYT-TRK', name: 'TYT Türkçe', tone: 'amber' },
  { code: 'AYT-EDB', name: 'AYT Edebiyat', tone: 'amber' },
  { code: 'TYT-FİZ', name: 'TYT Fizik', tone: 'rose' },
  { code: 'AYT-FİZ', name: 'AYT Fizik', tone: 'rose' },
  { code: 'TYT-KİM', name: 'TYT Kimya', tone: 'green' },
  { code: 'AYT-KİM', name: 'AYT Kimya', tone: 'green' },
  { code: 'TYT-BİY', name: 'TYT Biyoloji', tone: 'mint' },
  { code: 'AYT-BİY', name: 'AYT Biyoloji', tone: 'mint' },
  { code: 'GEO', name: 'Geometri', tone: 'indigo' },
  { code: 'PRG', name: 'Paragraf', tone: 'sand' },
];

window.DATA = DATA;
window.COURSE_OPTIONS = COURSE_OPTIONS;

// Helpers
window.findStudent = (id) => DATA.students.find(s => s.id === id) || DATA.students[0];
