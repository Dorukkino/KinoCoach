import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const navLinks = [
  { label: "Özellikler", href: "#özellikler" },
  { label: "İletişim", href: "/iletisim" },
];

const stats = [
  { value: "2.400+", label: "Aktif öğrenci" },
  { value: "38K", label: "Tamamlanan görev" },
  { value: "4.9", label: "Memnuniyet skoru" },
];

const features = [
  {
    icon: "users",
    title: "Öğrenci Yönetimi",
    desc: "Tek listede öğrenci durumu, ödeme hareketleri, görev ilerlemesi ve koçluk notları.",
    meta: "24 öğrenci tek ekranda",
  },
  {
    icon: "calendar",
    title: "Haftalık Program Takibi",
    desc: "7x10 formatlı program tablosu ile dersleri, kaynakları ve tamamlanma durumunu yönetin.",
    meta: "Programlar arası geçiş",
  },
  {
    icon: "trend",
    title: "Net Takibi",
    desc: "Deneme netlerini branş bazlı kaydedin ve gelişimi grafiklerle yorumlayın.",
    meta: "Son denemeyi incele",
  },
  {
    icon: "chat",
    title: "Chat Sistemi",
    desc: "Öğrencilerle güvenli kanaldan yazışın, PDF, fotoğraf ve çalışma kanıtı paylaşın.",
    meta: "Güvenli iletişim",
  },
  {
    icon: "spark",
    title: "Motivasyon Mesajları",
    desc: "Tek tuşla öğrenci davranışlarını özetleyen, kişisel ve motive edici notlar hazırlayın.",
    meta: "Hazır şablonlar",
  },
] as const;

function Icon({ name }: { name: (typeof features)[number]["icon"] }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "users":
      return (
        <svg {...common}>
          <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
          <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M18 11.5a2.5 2.5 0 0 0 0-5" />
          <path d="M20 19c0-1.5-.8-2.8-2-3.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <path d="M7 3v3M17 3v3M4 9h16" />
          <path d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
          <path d="M8 13h2M14 13h2M8 17h2" />
        </svg>
      );
    case "trend":
      return (
        <svg {...common}>
          <path d="m4 16 5-5 4 4 7-7" />
          <path d="M15 8h5v5" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M5 18.5V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 2.5Z" />
          <path d="M8 8h8M8 12h5" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 3 9.8 8.8 4 11l5.8 2.2L12 19l2.2-5.8L20 11l-5.8-2.2L12 3Z" />
          <path d="M19 3v4M21 5h-4" />
        </svg>
      );
  }
}

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Ana navigasyon">
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo2.png"
              alt=""
              width={34}
              height={31}
              className={styles.logoImage}
              priority
            />
            <span>KinoCoach</span>
          </Link>

          <div className={styles.navLinks}>
            {navLinks.map((item) => (
              <Link key={item.label} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.ghostButton}>
              Giriş Yap
            </Link>
            <Link href="/register" className={styles.darkButton}>
              Hemen Başla
            </Link>
          </div>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>YKS koçları için tasarlandı</p>
          <h1>
            Eğitim koçluğu sürecinizi <em>tek panelden yönetin.</em>
          </h1>
          <p className={styles.heroText}>
            Öğrencilerin yönetimi, haftalık program hazırlama, net gelişimi
            takipleri ve iletişim tek çatı altında toplanır.
          </p>

          <div className={styles.heroActions}>
            <Link href="/register" className={styles.darkButton}>
              Hemen Başla
            </Link>
            <Link href="/login" className={styles.lightButton}>
              Giriş Yap
            </Link>
          </div>

          <div className={styles.stats} aria-label="Platform istatistikleri">
            {stats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.mockupFrame}>
            <div className={styles.mockupBody}>
              <div className={styles.mockupStats}>
                <div>
                  <span>Öğrenci</span>
                  <strong>24</strong>
                </div>
                <div>
                  <span>Görev</span>
                  <strong>78</strong>
                </div>
                <div>
                  <span>Deneme</span>
                  <strong>12</strong>
                </div>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <span>Net Gelişim Grafiği</span>
                  <small>Son 6 hafta</small>
                </div>
                <div className={styles.chartGrid}>
                  <svg viewBox="0 0 360 170" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="landingChart" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2f7b6c" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#2f7b6c" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 130 C45 108 62 97 101 105 C145 112 170 70 213 64 C252 59 278 39 318 30 C338 26 349 19 360 15 L360 170 L0 170 Z"
                      fill="url(#landingChart)"
                    />
                    <path
                      d="M0 130 C45 108 62 97 101 105 C145 112 170 70 213 64 C252 59 278 39 318 30 C338 26 349 19 360 15"
                      fill="none"
                      stroke="#2f7b6c"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className={styles.studentRows}>
                  <span><i className={styles.dotAmber} />Ahmet Y.</span>
                  <span><i className={styles.dotGreen} />Ayşe K.</span>
                  <span><i className={styles.dotRose} />Mehmet A.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.features} id="özellikler">
        <div className={styles.sectionHead}>
          <span>Özellikler</span>
          <h2>
            Koçluğun her adımı için <em>tek bir panel.</em>
          </h2>
          <p>
            Excel tablolarına, WhatsApp gruplarına ve dağınık notlara veda edin.
            KinoCoach her şeyi yerinde toplar.
          </p>
        </div>

        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article className={styles.featureCard} key={feature.title}>
              <div className={styles.iconBox}>
                <Icon name={feature.icon} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              <a href="#fiyatlandırma">{feature.meta}</a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.quoteBlock}>
        <blockquote>
          Bir önceki seneye göre öğrenci başıma ayırdığım takip süresini yarıya
          indirdim. Sınav kaygısı yaşayan üç öğrencimi bu sayede zamanında fark
          ettim.
        </blockquote>
        <p>Seda Baran · YKS Eğitim Koçu, İstanbul</p>
      </section>

      <section className={styles.cta} id="fiyatlandırma">
        <div>
          <h2>Her zaman ücretsiz.</h2>
          <p>Tamamen ücretsiz kullanın. Kredi kartı gerekmez, gizli ücret yok.</p>
        </div>
        <div className={styles.ctaActions}>
          <Link href="/register" className={styles.darkButton}>
            Hemen Başla
          </Link>
          <Link href="/login" className={styles.lightButton}>
            Giriş Yap
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo2.png"
              alt=""
              width={34}
              height={31}
              className={styles.logoImage}
            />
            <span>KinoCoach</span>
          </Link>
          <p>Koçlar için öğrenci ve performans yönetimi platformu.</p>
        </div>

        <div className={styles.footerLinks}>
          <div>
            <strong>Ürün</strong>
            <a href="#özellikler">Özellikler</a>
          </div>
          <div>
            <strong>Şirket</strong>
            <Link href="/hakkimizda">Hakkımızda</Link>
            <Link href="/iletisim">İletişim</Link>
          </div>
          <div>
            <strong>Yasal</strong>
            <Link href="/gizlilik-politikasi">Gizlilik Politikası</Link>
            <Link href="/kullanim-sartlari">Kullanım Şartları</Link>
            <Link href="/kvkk">KVKK</Link>
            <Link href="/cerez-politikasi">Çerezler</Link>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© 2026 Kino Eğitim Teknolojileri</span>
          <span>v1.0 · güvenli</span>
        </div>
      </footer>
    </main>
  );
}
