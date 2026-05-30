import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "../_components/SiteFooter";
import styles from "./legal.module.css";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
};

export function LegalPage({
  eyebrow,
  title,
  description,
  sections,
}: LegalPageProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label={`${title} navigasyonu`}>
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
            <Link href="/iletisim" className={styles.darkButton}>
              İletişim
            </Link>
          </div>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>

      <section className={styles.contentShell}>
        {sections.map((section) => (
          <article className={styles.legalCard} key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      <SiteFooter />
    </main>
  );
}
