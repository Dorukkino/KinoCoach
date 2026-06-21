import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "../_components/SiteFooter";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Hakkımızda | KinoCoach",
  description: "KinoCoach hikayesi, misyonu, vizyonu ve eğitim koçluğu yaklaşımı.",
};

const platformItems = [
  {
    title: "Eğitim Koçları İçin",
    text: "Öğrenci takibini kolaylaştıran merkezi bir yönetim alanı. Koçlarımız, her bir öğrenci için haftalık ders programları hazırlayabilir, deneme sınavı sonuçlarını/netlerini grafiklerle analiz edebilir, özel gelişim notları tutabilir ve öğrencileriyle kesintisiz iletişimde kalabilir.",
  },
  {
    title: "Öğrenciler İçin",
    text: "Kendilerine özel hazırlanan haftalık programların tamamlanma oranlarını anlık olarak görebilecekleri, deneme netlerindeki yükseliş trendini izleyebilecekleri ve koçlarından gelen motivasyon mesajlarıyla süreçte aktif kalabilecekleri dinamik bir çalışma odası.",
  },
];

const reasons = [
  {
    title: "Veriye Dayalı Takip",
    text: 'Sadece "Çalıştın mı?" diye sormuyor; tamamlanma oranları ve net grafik gibi somut verilerle gelişimi kanıtlıyoruz.',
  },
  {
    title: "Zaman Tasarrufu",
    text: "Excel tabloları, kaybolan WhatsApp mesajları veya dağınık not kağıtları geride kaldı. Her şey tek bir profesyonel çatının altında.",
  },
  {
    title: "Sürekli Motivasyon",
    text: "Koçların anlık geri bildirimleri ve sistemin sunduğu ilerleme şemaları sayesinde öğrencilerin odağı her zaman zirvede kalır.",
  },
];

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Hakkımızda navigasyonu">
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo.png"
              alt=""
              width={34}
              height={31}
              className={styles.logoImage}
              priority
            />
            <span>KinoCoach</span>
          </Link>
          <div className={styles.navActions}>
            <Link href="/" className={styles.ghostButton}>
              Ana Sayfa
            </Link>
            <Link href="/register" className={styles.darkButton}>
              Hemen Başla
            </Link>
          </div>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Hakkımızda</p>
        <h1>KinoCoach Hikayesi</h1>
        <p>
          Eğitimde dijital dönüşümün ve bireyselleştirilmiş rehberliğin gücüne
          inanan yeni nesil bir SaaS yönetim platformu.
        </p>
      </section>

      <section className={styles.contentShell}>
        <article className={styles.leadCard}>
          <span>Biz Kimiz?</span>
          <p>
            KinoCoach, eğitimde dijital dönüşümün ve bireyselleştirilmiş
            rehberliğin gücüne inanan bir yazılım projesidir. Günümüz eğitim
            dünyasında öğrencilerin doğru yönlendirilmesi, koçların ise süreçleri
            verimli yönetmesi her zamankinden daha kritik bir hale geldi.
            KinoCoach; modern teknolojileri, öğrenci ve koçların günlük
            ihtiyaçlarıyla harmanlayan, yeni nesil bir SaaS (Yazılım Servisi)
            yönetim platformudur.
          </p>
        </article>

        <div className={styles.statementGrid}>
          <article>
            <span>Misyonumuz</span>
            <p>
              Öğrencilerin akademik ve kişisel gelişim yolculuklarını daha
              planlı, ölçülebilir ve şeffaf hale getirirken; eğitim koçlarının
              operasyonel yüklerini sıfıra indirmek. Koçlar ve öğrenciler
              arasında güçlü, kopmaz ve veriye dayalı bir iletişim köprüsü
              kurarak başarıyı tesadüf olmaktan çıkarıyoruz.
            </p>
          </article>
          <article>
            <span>Vizyonumuz</span>
            <p>
              Gelişmiş analitik araçlar, gerçek zamanlı takip mekanizmaları ve
              kullanıcı dostu arayüzümüzle, eğitim danışmanlığı ve öğrenci
              koçluğu denildiğinde akla ilk gelen küresel SaaS platformu olmak.
            </p>
          </article>
        </div>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHead}>
            <span>Platformumuz Ne Sunuyor?</span>
            <h2>Koçlar ve öğrenciler için iki güçlü panel.</h2>
          </div>
          <div className={styles.cardGridTwo}>
            {platformItems.map((item) => (
              <article key={item.title} className={styles.infoCard}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHead}>
            <span>Neden KinoCoach?</span>
            <h2>Başarıyı planlanabilir hale getiren yaklaşım.</h2>
          </div>
          <div className={styles.cardGridThree}>
            {reasons.map((item) => (
              <article key={item.title} className={styles.reasonCard}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.closingCard}>
          <p>
            Geleceğin eğitim yönetim standartlarını bugün inşa ediyoruz.
            KinoCoach ile başarıyı birlikte planlayın!
          </p>
          <Link href="/register" className={styles.darkButton}>
            Hemen Başla
          </Link>
        </section>
      </section>

      <SiteFooter />
    </main>
  );
}
