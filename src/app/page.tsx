import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center gap-8">
          <div className="flex items-center gap-2 font-semibold">
            <div className="brand-mark">k</div>
            Kino
          </div>
          <div className="ml-auto flex gap-3">
            <Link href="/login" className="btn btn-outline">
              Giriş
            </Link>
            <Link href="/register" className="btn btn-primary">
              Koç olarak başla
            </Link>
          </div>
        </div>
      </nav>
      <section className="landing-hero max-w-3xl mx-auto px-8">
        <p className="text-sm font-semibold text-[var(--accent-ink)] mb-4">
          YKS koçluğu için modern SaaS
        </p>
        <h1>Eğitim koçluğunu tek panelden yönetin</h1>
        <p className="text-[var(--muted)] text-lg max-w-xl mx-auto mb-8">
          Öğrenci takibi, haftalık program, deneme netleri, chat ve motivasyon —
          hepsi tek yerde.
        </p>
        <Link href="/register" className="btn btn-primary text-base px-6 py-3">
          Ücretsiz dene
        </Link>
      </section>
      <section className="max-w-5xl mx-auto px-8 pb-20 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Öğrenci yönetimi",
            desc: "Durum renkleri, tamamlama oranı ve detaylı profil.",
          },
          {
            title: "7×10 program",
            desc: "Excel benzeri grid ile haftalık görev planlama.",
          },
          {
            title: "Deneme & chat",
            desc: "Net grafikleri ve gerçek zamanlı koç iletişimi.",
          },
        ].map((f) => (
          <div key={f.title} className="panel p-6">
            <h3 className="font-semibold m-0 mb-2">{f.title}</h3>
            <p className="text-sm text-[var(--muted)] m-0">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
