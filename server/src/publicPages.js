// 20 Eylül eklemesi: Play Store yayını için gereken HERKESE AÇIK web
// sayfaları. Uygulama içindeki PrivacyScreen.tsx/TermsScreen.tsx zaten
// vardı ama Play Console'un Data Safety formu ve mağaza sayfası, tarayıcıdan
// doğrudan açılabilen bir URL istiyor — bu dosya AYNI metinleri (elden
// geldiğince birebir) düz HTML olarak, uygulamayı hiç açmadan görülebilecek
// şekilde sunuyor. İçerik değişirse İKİ yerde de (ekranlar + burası)
// güncellemeyi unutma.
//
// Ayrıca Play politikası, hesap oluşturma özelliği olan uygulamalarda
// UYGULAMA DIŞINDAN da erişilebilir bir hesap silme talep yolu istiyor —
// /account/delete-request bunu karşılıyor: kullanıcı e-postasını girip
// talep gönderiyor, bize (mevcut Resend altyapısıyla, "Sorun bildir" ile
// aynı yol) bir e-posta düşüyor, biz de Supabase'den siliyoruz. Bu OTOMATİK
// bir silme değil (kimlik doğrulaması olmadan web'den doğrudan silmek
// güvenli değil) — ama Play'in istediği "uygulamayı açmadan talep
// edebilme" şartını karşılıyor. İleride istersen bunu e-posta ile
// gönderilen bir onay linkine bağlayıp tam otomatik hale getirebiliriz.

const BRAND = {
  bg: "#FAF2E6",
  card: "#FFFFFF",
  text: "#201E1D",
  textMuted: "rgba(32,30,29,0.68)",
  border: "rgba(32,30,29,0.14)",
  primary: "#E48343",
  primaryDark: "#BD550E",
};

function pageShell({ title, bodyHtml }) {
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — özünde</title>
<style>
  *{box-sizing:border-box;}
  body{
    margin:0; background:${BRAND.bg}; color:${BRAND.text};
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    padding:32px 18px 64px;
  }
  .wrap{max-width:640px;margin:0 auto;}
  .eyebrow{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${BRAND.primaryDark};font-weight:700;margin:0 0 6px;}
  h1{font-size:26px;letter-spacing:-0.4px;margin:0 0 6px;}
  .updated{color:${BRAND.textMuted};font-size:12.5px;margin:0 0 26px;}
  section{
    background:${BRAND.card}; border:1px solid ${BRAND.border}; border-radius:14px;
    padding:18px 20px; margin-bottom:14px;
  }
  section h2{font-size:14px;margin:0 0 8px;}
  section p{font-size:13.5px;line-height:1.6;color:${BRAND.textMuted};margin:0;}
  a{color:${BRAND.primaryDark};}
  .back{display:inline-block;margin-bottom:18px;color:${BRAND.primaryDark};text-decoration:none;font-size:13px;font-weight:600;}
</style>
</head>
<body>
<div class="wrap">
${bodyHtml}
</div>
</body>
</html>`;
}

function section(title, html) {
  return `<section><h2>${title}</h2><p>${html}</p></section>`;
}

const LAST_UPDATED = "16 Eylül 2026";
const CONTACT_EMAIL = "destek.ozunde@gmail.com";

function renderPrivacyHtml() {
  const body = `
<p class="eyebrow">özünde &middot; yasal</p>
<h1>Gizlilik politikası</h1>
<p class="updated">Son güncelleme: ${LAST_UPDATED}</p>
${section(
  "1. Hangi verileri topluyoruz",
  `Ürün fotoğrafları: analiz için yüklediğin fotoğraflar, sonucu üretmek üzere sunucumuza ve oradan yapay zekâ sağlayıcımıza gönderilir — analiz tamamlandıktan sonra sunucumuzda saklanmaz. Profil bilgileri (isteğe bağlı): cilt/saç tipi, alerjiler, yaş, cinsiyet gibi bilgiler cihazında tutulur; sadece o anki analizi kişiselleştirmek için istek sırasında gönderilir, ayrıca saklanmaz. Analiz geçmişin: cihazında tutulur, sunucularımıza yüklenmez. Hesap bilgilerin (hesap oluşturursan): e-posta adresin ve şifren (Google ile giriş yaptıysan Google hesabından gelen ad/e-posta/profil fotoğrafı), kimlik doğrulama sağlayıcımız tarafından tutulur. Sorun bildirimleri: "Sorun bildir" ile gönderdiğin açıklama ve varsa fotoğraf, e-posta yoluyla bize ulaştırılır.`
)}
${section(
  "2. Verilerini ne için kullanıyoruz",
  `Ürün analizini üretmek, hesabına giriş yapabilmeni sağlamak, abonelik/kota durumunu yönetmek, gönderdiğin sorun bildirimlerine yanıt verebilmek ve uygulamayı iyileştirmek için kullanıyoruz. Verilerini reklam amacıyla satmıyoruz veya üçüncü taraflara pazarlama amacıyla aktarmıyoruz.`
)}
${section(
  "3. Kiminle paylaşıyoruz (hizmet sağlayıcılarımız)",
  `Verilerini, sana hizmet sunabilmemiz için gerekli olan şu alanlarda çalışan iş ortaklarımızla paylaşırız: yapay zekâ analiz hizmeti (ürün fotoğraflarını ve varsa profil bilgini analiz üretmek için işler), kimlik doğrulama hizmeti (hesap oluşturma/giriş altyapımızı sağlar, hesap bilgini tutar) ve e-posta iletim hizmeti ("Sorun bildir" e-postalarının iletilmesini sağlar). Bu iş ortaklarımız, verilerini SADECE bize hizmet sağlamak amacıyla, kendi gizlilik/güvenlik politikalarına tabi olarak işler. Verilerin, bu sağlayıcıların sunucularının bulunduğu ülkelere (Türkiye dışına) aktarılabileceğini bilmeni isteriz.`
)}
${section(
  "4. Ne kadar süre saklıyoruz",
  `Ürün fotoğrafların, analiz tamamlanır tamamlanmaz sunucumuzdan silinir (saklanmaz). Aynı ürün adıyla yapılan analizler, maliyeti azaltmak için kısa süreli bir önbellekte (ürün adı + analiz sonucu, kişisel bilgi içermez) tutulabilir. Hesap bilgilerin, hesabını silene kadar saklanır. Analiz geçmişin ve profil bilgilerin sadece cihazında tutulur — uygulama içindeki Ayarlar &rsaquo; "Verilerimi sil" ile istediğin an cihazından silebilirsin.`
)}
${section(
  "5. Haklarının (KVKK)",
  `6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında; verilerinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, düzeltilmesini veya silinmesini isteme haklarına sahipsin. Avrupa Birliği'nde bulunuyorsan GDPR kapsamındaki haklarını da kullanabilirsin. Bu haklarını kullanmak için bizimle <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> adresinden iletişime geçebilirsin.`
)}
${section(
  "6. Hesabını silmek",
  `Uygulama içindeki Ayarlar &rsaquo; Hesap bölümünden hesabını istediğin zaman kalıcı olarak silebilirsin — bu işlem geri alınamaz ve hesap bilgilerini (e-posta, kimlik doğrulama kaydı) siler. Uygulamayı açmadan da talep etmek istersen: <a href="/account/delete-request">buradan</a>. Cihazında tuttuğun analiz geçmişi/profil bilgisi ayrı bir işlemdir (uygulama içinde "Verilerimi sil").`
)}
${section(
  "7. Güvenlik",
  `Verilerini korumak için makul teknik ve idari önlemler alıyoruz (ör. şifreler bizim tarafımızda düz metin olarak tutulmaz, kimlik doğrulama sağlayıcımız üzerinden hash'lenerek saklanır). Ancak hiçbir sistem %100 güvenli değildir.`
)}
${section("8. Çocukların gizliliği", `Uygulama 13 yaşından küçük çocuklara yönelik değildir ve bilerek onlardan veri toplamayız.`)}
${section(
  "9. Değişiklikler",
  `Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişikliklerde uygulama içinden bilgilendirme yapmaya çalışırız.`
)}
${section("10. İletişim", `Gizlilikle ilgili sorular için: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`)}
`;
  return pageShell({ title: "Gizlilik politikası", bodyHtml: body });
}

function renderTermsHtml() {
  const body = `
<p class="eyebrow">özünde &middot; yasal</p>
<h1>Kullanım koşulları</h1>
<p class="updated">Son güncelleme: ${LAST_UPDATED}</p>
${section(
  "1. Kabul",
  `özünde uygulamasını ("Uygulama") indirerek, hesap oluşturarak veya kullanarak bu Kullanım Koşulları'nı kabul etmiş olursun. Koşulları kabul etmiyorsan Uygulamayı kullanmamalısın.`
)}
${section(
  "2. Uygulama ne yapar",
  `özünde, yüklediğin bir ürün fotoğrafından/etiketinden yapay zekâ ile içerik analizi yapar ve sana genel bir değerlendirme (etkinlik, sağlık skoru, bileşen bazlı risk değerlendirmesi gibi) sunar. Bu değerlendirmeler otomatik olarak üretilir ve yalnızca bilgilendirme amaçlıdır.`
)}
${section(
  "3. Tıbbi/profesyonel tavsiye değildir",
  `Uygulamadaki hiçbir içerik tıbbi, dermatolojik, eczacılık veya benzeri bir profesyonel tavsiye yerine geçmez. Bir bileşenle ilgili alerjin, hassasiyetin veya sağlık durumunla ilgili endişen varsa bir doktora veya uzmana danış.`
)}
${section(
  "4. Hesap oluşturma",
  `Hesap oluşturmak zorunlu değildir — Uygulamanın çoğu özelliği hesapsız da çalışır. Hesap oluşturursan (e-posta/şifre veya Google ile) doğru ve güncel bilgi vermekle, hesabının güvenliğinden sorumlusun.`
)}
${section(
  "5. Abonelik ve ödemeler",
  `Uygulama içinde ücretli paketler (aylık tarama kotası) ve tek seferlik ek tarama paketleri sunulabilir. Ücretli bir paket satın aldığında, satın alma uygulama mağazasının (Google Play) kendi ödeme ve abonelik altyapısı üzerinden gerçekleşir; abonelikler aksi belirtilmedikçe otomatik yenilenir. Aboneliğini istediğin zaman Play Store uygulamasından iptal edebilirsin. İadeler, Google Play'in kendi iade politikasına tabidir; özünde doğrudan ödeme bilgini görmez veya saklamaz.`
)}
${section(
  "6. Kabul edilebilir kullanım",
  `Uygulamayı yasa dışı bir amaçla, başkalarının haklarını ihlal edecek şekilde veya Uygulamanın altyapısına zarar verecek şekilde kullanmamayı kabul edersin.`
)}
${section(
  "7. İçerik ve fikri mülkiyet",
  `Uygulamanın tasarımı, markası ve yazılımı özünde'ye aittir. Taradığın ürünlere ait fotoğraflar/etiketler kendi sorumluluğundadır; bu içerikleri yalnızca analiz hizmetini sağlamak amacıyla işleriz.`
)}
${section(
  "8. Sorumluluğun sınırlanması",
  `Uygulama "olduğu gibi" sunulur. Yasaların izin verdiği azami ölçüde, Uygulamanın kullanımından doğabilecek dolaylı, arızi veya sonuç niteliğindeki zararlardan sorumlu değiliz.`
)}
${section(
  "9. Hesap silme ve fesih",
  `Hesabını istediğin zaman kalıcı olarak silebilirsin (uygulama içinden ya da <a href="/account/delete-request">bu sayfadan</a>). Kullanım koşullarını ihlal etmen durumunda hesabına erişimini askıya alabilir veya sonlandırabiliriz.`
)}
${section(
  "10. Değişiklikler",
  `Bu koşulları zaman zaman güncelleyebiliriz. Güncelleme sonrası Uygulamayı kullanmaya devam etmen, yeni koşulları kabul ettiğin anlamına gelir.`
)}
${section("11. Uygulanacak hukuk", `Bu koşullar Türkiye Cumhuriyeti kanunlarına tabidir.`)}
${section("12. İletişim", `Sorularınız için: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`)}
`;
  return pageShell({ title: "Kullanım koşulları", bodyHtml: body });
}

function renderDeleteRequestFormHtml({ status } = {}) {
  let statusHtml = "";
  if (status === "sent") {
    statusHtml = `<section style="border-color:#BFD8B0;background:#EEF6E7;"><h2>Talebin alındı</h2><p>Hesap silme talebini aldık — en geç 30 gün içinde hesabını (e-posta, kimlik doğrulama kaydın) kalıcı olarak sileceğiz ve sana onay e-postası göndereceğiz. Cihazındaki analiz geçmişi/profil bilgisi bu işlemden etkilenmez, onu istersen uygulama içinden ayrıca silebilirsin.</p></section>`;
  } else if (status === "error") {
    statusHtml = `<section style="border-color:#E3B8AC;background:#F7E4DE;"><h2>Bir şeyler ters gitti</h2><p>Talebin gönderilemedi. Lütfen tekrar dener misin, ya da doğrudan <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> adresine e-posta at.</p></section>`;
  }
  const body = `
<p class="eyebrow">özünde &middot; hesap</p>
<h1>Hesabını sil</h1>
<p class="updated">Uygulamayı açmadan da hesap silme talebi gönderebilirsin.</p>
${statusHtml}
<section>
  <h2>Nasıl çalışır</h2>
  <p>Aşağıya hesabına bağlı e-posta adresini yaz ve gönder. Talebini aldıktan sonra (en geç 30 gün içinde) hesabını Supabase'deki kimlik doğrulama kaydından kalıcı olarak sileriz — bu işlem geri alınamaz. Uygulamayı hâlâ açabiliyorsan, doğrudan Ayarlar &rsaquo; Hesap bölümünden anında silmen daha hızlıdır.</p>
</section>
<section>
  <form method="POST" action="/account/delete-request" style="display:flex;flex-direction:column;gap:10px;">
    <label style="font-size:12.5px;font-weight:700;">Hesabına bağlı e-posta adresi</label>
    <input type="email" name="email" required placeholder="ornek@eposta.com"
      style="height:42px;border-radius:10px;border:1px solid ${BRAND.border};padding:0 12px;font-size:14px;">
    <button type="submit"
      style="height:44px;border:none;border-radius:999px;background:${BRAND.primary};color:#fff;font-size:14px;font-weight:700;cursor:pointer;margin-top:4px;">
      Hesap silme talebi gönder
    </button>
  </form>
</section>
`;
  return pageShell({ title: "Hesabını sil", bodyHtml: body });
}

module.exports = { renderPrivacyHtml, renderTermsHtml, renderDeleteRequestFormHtml, CONTACT_EMAIL };
