import type { Metadata } from "next";
import { LegalPage } from "../_legal/LegalPage";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | KinoCoach",
  description: "KinoCoach kullanıcı verilerinin toplanması, saklanması ve korunması.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="Gizlilik Politikası"
      description="KinoCoach kullanıcı verilerinin nasıl toplandığını, nerede saklandığını ve nasıl korunduğunu açıklar."
      sections={[
        {
          title: "Toplanan Veriler",
          paragraphs: [
            "KinoCoach; hesap oluşturma, koç-öğrenci eşleşmesi, ders programı takibi, deneme sınavı analizi ve platform içi iletişim süreçlerini sunabilmek için gerekli kullanıcı verilerini işler.",
            "Bu kapsamda ad, soyad, e-posta adresi, kullanıcı rolü, ders programları, gelişim grafikleri, deneme netleri, koç notları ve platform içi iletişim verileri işlenebilir.",
          ],
        },
        {
          title: "Verilerin Saklanması ve Güvenliği",
          paragraphs: [
            "KinoCoach, Supabase altyapısı ve PostgreSQL veri tabanı kullanır. Şifreler ve kullanıcı verileri güvenli kimlik doğrulama sistemleriyle korunur.",
            "KinoCoach, eğitim koçları ve öğrencilerin platform içerisindeki gelişim grafiklerini, ders programlarını ve iletişim verilerini şifrelenmiş güvenli sunucularda saklar. Bu veriler üçüncü taraflarla kesinlikle paylaşılmaz.",
          ],
        },
        {
          title: "Verilerin Kullanım Amacı",
          paragraphs: [
            "Veriler; kullanıcı hesabının yönetilmesi, koç ve öğrenci hesaplarının eşleştirilmesi, eğitim performansının takip edilmesi, grafiklerin oluşturulması ve destek taleplerinin yanıtlanması amacıyla kullanılır.",
          ],
        },
      ]}
    />
  );
}
