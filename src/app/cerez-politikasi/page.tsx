import type { Metadata } from "next";
import { LegalPage } from "../_legal/LegalPage";

export const metadata: Metadata = {
  title: "Çerez Politikası | KinoCoach",
  description: "KinoCoach çerez kullanımı ve oturum yönetimi açıklaması.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Cookie Policy"
      title="Çerez Politikası"
      description="KinoCoach platformunda kullanılan zorunlu ve fonksiyonel çerezleri açıklar."
      sections={[
        {
          title: "Çerez Kullanımı",
          paragraphs: [
            "KinoCoach, kullanıcı oturumlarının güvenli bir şekilde sürdürülmesi ve kullanıcı tercihlerinin hatırlanması amacıyla zorunlu çerezler (cookies) kullanmaktadır.",
            "Bu çerezler, kullanıcının her sayfayı yenilediğinde tekrar giriş yapmak zorunda kalmaması ve platformun güvenli şekilde çalışması için gereklidir.",
          ],
        },
        {
          title: "Supabase Oturum Yönetimi",
          paragraphs: [
            "Platformda Supabase session yönetimi kullanılır. Oturum çerezleri, giriş yapan kullanıcının kimliğinin güvenli biçimde doğrulanmasına ve yetkili olduğu panellere erişebilmesine yardımcı olur.",
          ],
        },
        {
          title: "Zorunlu ve Fonksiyonel Çerezler",
          items: [
            "Zorunlu çerezler, güvenli oturum yönetimi ve temel platform işlevleri için kullanılır.",
            "Fonksiyonel çerezler, kullanıcı deneyimini iyileştirmek ve tercihleri hatırlamak amacıyla kullanılabilir.",
            "Bu çerezler reklam veya üçüncü taraf pazarlama amacıyla kullanılmaz.",
          ],
        },
      ]}
    />
  );
}
