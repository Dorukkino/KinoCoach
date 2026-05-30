import type { Metadata } from "next";
import { LegalPage } from "../_legal/LegalPage";

export const metadata: Metadata = {
  title: "Kullanım Şartları | KinoCoach",
  description: "KinoCoach platform kullanım kuralları ve sorumluluk sınırları.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Terms of Service"
      title="Kullanım Şartları"
      description="KinoCoach platformunu kullanırken uyulması gereken kuralları ve sorumluluk sınırlarını açıklar."
      sections={[
        {
          title: "Platform Kullanımı",
          paragraphs: [
            "KinoCoach; eğitim koçlarının öğrencilerini takip etmesi, ders programları hazırlaması, deneme sınavı sonuçlarını analiz etmesi ve öğrencileriyle iletişim kurması için sunulan bir eğitim teknolojisi platformudur.",
            "Kullanıcılar platformu yalnızca hukuka, etik kurallara ve eğitim amaçlarına uygun şekilde kullanmakla yükümlüdür.",
          ],
        },
        {
          title: "Hesap Güvenliği",
          paragraphs: [
            "Koçlar davetiye gönderirken doğru e-posta adresi girmekten, öğrenciler ise hesaplarını başkalarına kullandırmamaktan sorumludur.",
            "Kullanıcılar hesap bilgilerinin gizliliğini korumalı ve yetkisiz kullanım şüphesi oluştuğunda KinoCoach ile iletişime geçmelidir.",
          ],
        },
        {
          title: "Sorumluluk Sınırları",
          paragraphs: [
            "KinoCoach, platformun kesintisiz çalışması için gerekli teknik özeni gösterir. Ancak kullanıcılar, hesap bilgilerinin gizliliğini korumakla yükümlüdür. Platform, koç ve öğrenci arasındaki rehberlik ilişkisinin içeriğinden hukuki olarak sorumlu tutulamaz.",
            "Platformda tutulan programlar, notlar ve analizler eğitim takibini kolaylaştırmak amacıyla sunulur; nihai eğitim kararları kullanıcıların sorumluluğundadır.",
          ],
        },
      ]}
    />
  );
}
