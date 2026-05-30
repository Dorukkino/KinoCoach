import type { Metadata } from "next";
import { LegalPage } from "../_legal/LegalPage";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni | KinoCoach",
  description: "KinoCoach kişisel verilerin işlenmesine ilişkin KVKK aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <LegalPage
      eyebrow="KVKK"
      title="KVKK Aydınlatma Metni"
      description="KinoCoach tarafından işlenen kişisel veriler, işleme amaçları ve kullanıcı hakları hakkında bilgilendirme."
      sections={[
        {
          title: "Veri Sorumlusu",
          paragraphs: [
            "KinoCoach, İstanbul merkezli yürütülen bir eğitim teknolojisi projesi olarak kullanıcıların kişisel verilerini 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işler.",
            "Kişisel veriler; platform hizmetlerinin sunulması, güvenli oturum yönetimi, koç-öğrenci süreçlerinin yürütülmesi ve destek taleplerinin yanıtlanması amacıyla işlenir.",
          ],
        },
        {
          title: "İşlenen Veri Kategorileri",
          items: [
            "Kimlik ve İletişim Verisi: Ad, soyad ve e-posta adresi; hesap açma, giriş yapma ve koç-öğrenci davetiye süreçleri için işlenir.",
            "Eğitim Performans Verisi: Deneme sınavı netleri, ders tamamlama oranları, haftalık programlar ve koçların tuttuğu özel notlar; platformun temel işlevini yerine getirebilmesi ve analiz grafiklerinin oluşturulması için işlenir.",
            "İşlem Güvenliği Verisi: Oturum bilgileri ve güvenli kimlik doğrulama kayıtları; hesabın korunması ve yetkisiz erişimin önlenmesi için işlenir.",
          ],
        },
        {
          title: "Haklarınız",
          paragraphs: [
            "Kullanıcılar, KVKK kapsamında kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, eksik veya yanlış işlenen verilerin düzeltilmesini isteme ve ilgili mevzuat çerçevesinde silme veya anonimleştirme talep etme haklarına sahiptir.",
          ],
        },
      ]}
    />
  );
}
