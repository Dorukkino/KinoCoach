import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sendContactMessageAction } from "@/app/actions/contact";
import { SiteFooter } from "../_components/SiteFooter";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "İletişim | KinoCoach",
  description: "KinoCoach sıkça sorulan sorular ve destek iletişim formu.",
};

const faqs = [
  {
    question: "Sistemde koç ve öğrenci hesapları birbirine nasıl bağlanır?",
    answer:
      "Koç dashboard panelinden öğrencinin e-posta adresine bir davetiye gönderilir. Öğrenci, platforma üye olduğunda veya hesabına giriş yaptığında bu davetiye banner'ını onaylayarak koçuyla anında eşleşir.",
  },
  {
    question: "Deneme sınavı sonuçları gerçek zamanlı olarak güncelleniyor mu?",
    answer:
      "Evet. Supabase altyapımızın sunduğu Realtime (gerçek zamanlı) kanal özellikleri sayesinde, koçun veya öğrencinin yaptığı ders programı güncellemeleri ve sınav netleri iki panelde de anlık olarak senkronize olur.",
  },
  {
    question: "Kurumsal veya çoklu koç desteğiniz var mı?",
    answer:
      "Platformumuz katmanlı ve esnek bir veri mimarisine sahiptir. Çoklu koç notları ve genişletilebilir veri tabanı şemamız sayesinde eğitim kurumları için toplu çözümler sunabilmekteyiz. Detaylar için kurumsal e-posta adresimizden bizimle iletişime geçebilirsiniz.",
  },
];

const roleOptions = [
  "Eğitim Koçuyum / Kurumum Var",
  "Öğrenciyim / Veliyim",
  "Diğer / İş Birliği",
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ContactPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = typeof params.durum === "string" ? params.durum : undefined;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="İletişim navigasyonu">
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
        <p className={styles.eyebrow}>İletişim</p>
        <h1>Size nasıl yardımcı olabiliriz?</h1>
        <p>
          Bize yazmadan önce aradığınız cevabı hızlı çözümler bölümünde
          bulabilirsiniz.
        </p>
      </section>

      <section className={styles.contentShell}>
        <section className={styles.faqSection} aria-labelledby="faq-title">
          <div className={styles.sectionHead}>
            <span>(SSS) Sıkça Sorulan Sorular</span>
            <h2 id="faq-title">Hızlı Çözümler</h2>
            <p>Bize yazmadan önce, aradığınız cevabı burada bulabilirsiniz:</p>
          </div>

          <div className={styles.faqList}>
            {faqs.map((item) => (
              <article className={styles.faqCard} key={item.question}>
                <h3>Soru: {item.question}</h3>
                <p>Cevap: {item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.supportCta}>
          <div>
            <span>Destek</span>
            <h2>Cevabınızı bulamadınız mı?</h2>
            <p>
              Destek formunu doldurun; ekibimiz en geç 24 saat içinde size geri
              dönüş sağlayacaktır.
            </p>
          </div>
          <a href="#iletisim-formu" className={styles.darkButton}>
            Destek Formuna Git
          </a>
        </section>

        <section
          className={styles.formSection}
          id="iletisim-formu"
          aria-labelledby="form-title"
        >
          <div className={styles.sectionHead}>
            <span>1. İletişim Formu</span>
            <h2 id="form-title">Bize mesaj gönderin.</h2>
            <p>
              Lütfen bilgilerinizi eksiksiz doldurun; ekibimiz en geç 24 saat
              içinde size geri dönüş sağlayacaktır.
            </p>
          </div>

          {status ? <StatusMessage status={status} /> : null}

          <form className={styles.contactForm} action={sendContactMessageAction}>
            <label>
              <span>Adınız Soyadınız</span>
              <input type="text" name="fullName" autoComplete="name" required />
            </label>

            <label>
              <span>E-posta Adresiniz</span>
              <input type="email" name="email" autoComplete="email" required />
            </label>

            <fieldset>
              <legend>Kullanıcı Rolünüz</legend>
              <div className={styles.roleOptions}>
                {roleOptions.map((role) => (
                  <label key={role} className={styles.checkboxLabel}>
                    <input type="checkbox" name="role" value={role} />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label>
              <span>Konu</span>
              <input type="text" name="subject" required />
            </label>

            <label>
              <span>Mesajınız</span>
              <textarea name="message" rows={7} required />
            </label>

            <button type="submit" className={styles.submitButton}>
              Mesajı Gönder
            </button>
          </form>
        </section>
      </section>

      <SiteFooter />
    </main>
  );
}

function StatusMessage({ status }: { status: string }) {
  if (status === "basarili") {
    return (
      <p className={`${styles.formStatus} ${styles.formStatusSuccess}`}>
        Mesajınız başarıyla gönderildi. Ekibimiz en geç 24 saat içinde size geri
        dönüş sağlayacaktır.
      </p>
    );
  }

  if (status === "eksik") {
    return (
      <p className={`${styles.formStatus} ${styles.formStatusError}`}>
        Lütfen tüm alanları eksiksiz doldurun.
      </p>
    );
  }

  if (status === "hata") {
    return (
      <p className={`${styles.formStatus} ${styles.formStatusError}`}>
        Mesaj gönderilirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.
      </p>
    );
  }

  return null;
}
