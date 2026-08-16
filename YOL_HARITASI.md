# Ürün Analiz — Ürünün Gerçek Ürünleri Anlaması İçin Yol Haritası

Bu doküman, mevcut Expo (React Native) taslağının üzerine, uygulamanın gerçek
kişisel bakım ürünlerini güvenilir şekilde analiz edebilmesi için hangi
özelliklerin hangi sırayla eklenmesi gerektiğini özetler. Fazlar birbirinin
üzerine inşa edilecek şekilde sıralandı; bir faz tamamlanmadan sonrakine geçmek
teknik olarak mümkün ama önerilmez, çünkü her faz bir öncekinin kırılganlığını
azaltıyor.

## Şu Anki Durum (Referans Noktası)

Mevcut uygulama: kamera/galeriden fotoğraf alıyor, bir backend'e (varsa)
gönderiyor, backend yoksa/başarısızsa örnek (mock) veri gösteriyor. Ekranlar,
navigasyon, aylık tarama limiti ve paywall akışı hazır. **Şu an hiçbir
fotoğraf gerçekten analiz edilmiyor** — bu yüzden Faz 1 her şeyin önkoşulu.

---

## Faz 1 — Gerçek AI Analizini Devreye Alma (önkoşul)

**Neden:** Bu olmadan uygulama hiçbir zaman gerçek bir ürünü "görmüyor".

**Yapılacaklar:**
- `server/` klasöründeki backend'i bir yere deploy etmek (Render, Railway,
  Fly.io gibi ücretsiz/ucuz bir platform yeterli).
- Bir Anthropic API anahtarı alıp backend'e tanımlamak.
- Mobil uygulamadaki `EXPO_PUBLIC_API_URL` değişkenini deploy edilen adrese
  yönlendirmek.
- Gerçek ürün fotoğraflarıyla (en az 15-20 farklı marka/kategori: şampuan,
  krem, serum, sabun, deodorant) manuel test yapıp modelin ne sıklıkla doğru
  marka/ürün adı çıkardığını, içerik listesini ne kadar eksiksiz okuduğunu
  gözlemlemek.

**Tahmini efor:** Düşük–Orta (çoğu kod zaten hazır, esas iş deploy + test).

**Başarı ölçütü:** Test edilen ürünlerin en az %70'inde marka/ürün adı doğru
tanınıyor, içerik listesinin büyük kısmı doğru okunuyor.

---

## Faz 2 — Doğruluk ve Güvenilirlik

Faz 1 canlıya alındığında muhtemelen görülecek en büyük sorun şu: model bazen
markayı yanlış tahmin eder, bazı bileşenleri "uydurur" (halüsinasyon), ya da
etiket bulanık/parlamalıysa hiç okuyamaz. Bu fazın amacı bunu azaltmak.

**2a. Çekim kalitesi ve yönlendirme**
- Kullanıcıyı "içerik listesini net ve yakından çerçevele" gibi görsel
  ipuçlarıyla yönlendirmek.
- Gerekirse tek fotoğraf yerine iki adım istemek: ürünün ön yüzü (marka/isim
  için) + arka yüzü (içerik listesi için).
- Bulanıklık/parlama tespitiyle "fotoğraf net değil, tekrar çeker misin?"
  uyarısı (basit bir görüntü kalitesi kontrolü ile yapılabilir).

**2b. Barkod okuma + açık ürün veritabanı**
- `expo-camera`'nın barkod tarama özelliğini eklemek.
- Barkod bulunursa, **Open Beauty Facts** (kozmetik ürünler için ücretsiz,
  açık bir veritabanı — Open Food Facts'in kozmetik versiyonu) gibi bir
  kaynaktan ürünü sorgulamak. Bulunursa marka/ürün adı/içerik listesi oradan
  gelir, AI'nin sadece yorumlama/risk değerlendirmesi yapması yeterli olur —
  bu, "tahmin" yerine "kesin bilgi" demektir.
- Barkod veritabanında yoksa mevcut fotoğraf+AI akışına geri düşülür.

**2c. Kullanıcı düzeltme akışı**
- Sonuç ekranına "Bu ürün doğru tanınmadı mı? Düzelt" seçeneği eklemek.
  Kullanıcı marka/ürün adını elle girebilsin. Bu hem o anki kullanıcı
  deneyimini kurtarır hem de zamanla hangi ürünlerde model zorlandığına dair
  veri biriktirir.

**2d. Bileşen risk doğrulama katmanı**
- AI'nin ürettiği "riskli/faydalı" etiketlerini, mümkünse bilinen bir
  INCI/kozmetik bileşen referans listesiyle çapraz kontrol etmek (ör. EWG
  Skin Deep'in kategorileri, ya da COSING - AB'nin kozmetik bileşen
  veritabanı). Bu, modelin kendi başına karar vermesi yerine bir referansa
  dayanmasını sağlar, güvenilirliği artırır.

**Tahmini efor:** Orta–Yüksek (barkod entegrasyonu ve dış veritabanı
sorgulaması yeni bir katman).

**Başarı ölçütü:** Barkodlu ürünlerde %95+ doğru ürün eşleşmesi; barkodsuz
ürünlerde kullanıcı düzeltme oranı zamanla düşüyor.

---

## Faz 3 — Gerçek Kullanıcı Yorumları

Şu anki "Kullanıcılar Ne Diyor?" bölümü AI'nin genel bilgisinden üretilen
**makul bir tahmin**, gerçek istatistik değil. Bunu gerçek veriye
dönüştürmenin iki yolu var, ideal olan ikisini zamanla birleştirmek:

- **Uygulama içi kendi yorum/puanlama sistemimiz:** Kullanıcılar taradıkları
  ürünü kullandıktan sonra puanlayıp yorum bırakabilsin. Başta veri az
  olacak ama tamamen bize ait, güvenilir ve zamanla büyüyen bir varlık
  olur — rakiplere karşı en güçlü hendek de bu olacaktır.
- **Web'den gerçek yorum özeti:** Bir web arama/okuma entegrasyonuyla, o
  ürün hakkında internette (forumlar, e-ticaret siteleri, sosyal medya)
  yazılanları toplayıp AI'ye özetletmek. Uygulama içi veri henüz azken
  başlangıç için daha zengin bir deneyim sağlar.

**Tahmini efor:** Orta (kendi sistemimiz) – Yüksek (web toplama +
güvenilirlik/moderasyon).

**Başarı ölçütü:** Kullanıcıların en az %20'si taradığı bir üründe geri
bildirim/puan bırakıyor (uygulama içi sistem için).

---

## Faz 4 — Ölçek ve Maliyet Optimizasyonu

Kullanıcı sayısı arttıkça aynı ürün defalarca taranacak (ör. herkesin
evinde aynı marka şampuan olabilir). Her seferinde AI'ye yeniden sormak hem
pahalı hem gereksiz.

- Barkod ya da (barkod yoksa) marka+ürün adı normalize edilmiş haliyle,
  bir kere analiz edilen ürünü paylaşımlı bir veritabanında (ör. Supabase/
  Postgres) önbelleğe almak.
- Yeni bir kullanıcı aynı ürünü taradığında, önce bu ortak veritabanına
  bakılır; varsa anında sonuç gösterilir (AI çağrısı yapılmaz), yoksa AI'ye
  sorulup sonuç veritabanına eklenir.
- Bu aynı zamanda Faz 3'teki "gerçek yorumlar"ın ürün bazında birikmesini de
  kolaylaştırır (ürün merkezli bir veri modeli oluşur).

**Tahmini efor:** Orta (veritabanı şeması + cache mantığı).

**Başarı ölçütü:** Taramaların %50+'ı önbellekten (AI çağrısı yapmadan)
karşılanıyor (kullanıcı sayısı büyüdükçe bu oran artmalı).

---

## Faz 5 — Gerçek Abonelik/Ödeme

Mevcut paywall demo amaçlı. Gerçek gelir için:
- RevenueCat hesabı + App Store Connect / Google Play Console'da aylık
  abonelik ürünü tanımlamak.
- `react-native-purchases` (RevenueCat SDK) entegrasyonu — bu adım Expo
  Go'da çalışmaz, bir "development build" (`eas build`) gerektirir, yani bu
  noktada Expo Go'dan native build sürecine geçiş yapılmış olur.

**Tahmini efor:** Orta (RevenueCat kurulumu iyi dokümante, ama App
Store/Play Store onay süreçleri zaman alabilir).

---

## Faz 6 — Yasal/Uyum (arka planda sürekli göz önünde tutulmalı)

Bu bir faz olmaktan çok, her fazda dikkat edilmesi gereken bir katman:
- Sağlık/etkinlik iddialarında "kesin" dil kullanmamak, hep "gösterilmiştir",
  "düşünülüyor" gibi temkinli ifadeler + disclaimer (zaten prompt'ta var).
- Kullanıcı fotoğrafları/verileri saklanıyorsa KVKK (Türkiye) ve varsa GDPR
  uyumluluğu: açık rıza metni, veri saklama/silme politikası.
- Barkod veritabanı ve üçüncü taraf veri kaynaklarının lisans şartlarına
  uymak (Open Beauty Facts açık lisanslı, ama atıf gerekebilir).

---

## Önerilen Sıralama (Özet)

1. **Faz 1** — Backend'i bağla, gerçek AI analizini aktif et. *(Şimdi yapılabilir, her şeyin önkoşulu.)*
2. **Faz 2** — Barkod + doğrulama + düzeltme akışı. *(Doğruluğu ciddi şekilde artırır.)*
3. **Faz 3** — Kendi yorum sistemimiz (en azından basit puanlama ile başla). *(Uzun vadeli en güçlü rekabet avantajı.)*
4. **Faz 4** — Ürün önbelleği. *(Kullanıcı sayısı büyümeye başlayınca öncelik kazanır.)*
5. **Faz 5** — Gerçek ödeme. *(Gelir modeline geçiş, ürün olgunlaştıktan sonra.)*
6. **Faz 6** — Sürekli, arka planda.

Her faz kendi başına teslim edilebilir ve test edilebilir bir birim; yani
Faz 2'ye geçmeden Faz 1'i canlıya alıp gerçek kullanıcı geri bildirimi
toplamak, sonraki fazların önceliklerini de netleştirecektir.
