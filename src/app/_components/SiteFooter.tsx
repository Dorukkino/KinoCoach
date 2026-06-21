import Image from "next/image";
import Link from "next/link";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerBrand}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo.png"
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
          <Link href="/#özellikler">Özellikler</Link>
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
  );
}
