# Ürün Analiz (MVP)

Kişisel bakım ürünlerinin (şampuan, krem, serum vb.) fotoğrafını çekerek: içeriğini,
gerçekten işe yarayıp yaramadığını, sağlıklı/zararlı bileşenlerini ve kullanıcı
yorumu özetini gösteren, aylık abonelik modelli bir mobil uygulama.

Kamera, ürünün barkodunu otomatik algılar. Barkod bulunursa uygulama önce
paylaşımlı bir önbelleğe, sonra Open Beauty Facts (ücretsiz açık kozmetik
veritabanı) sorgusuna bakar — böylece daha önce taranmış bir ürün anında,
AI'ye tekrar sormadan gösterilir. Barkod yoksa ya da veritabanında yoksa,
çekilen fotoğraf doğrudan AI ile analiz edilir. Detaylar için
`server/README.md`.

Expo (React Native) ile yazıldı — **hem iOS hem Android'de Expo Go üzerinden
anında test edilebilir**, ekstra native build gerekmez.

## Bu paket ne içeriyor?

```
urun-analiz/
├── App.tsx                  # Navigasyon + context sağlayıcıları
├── src/
│   ├── screens/              # Home, Scan, Analyzing, Result, History, Paywall
│   ├── context/               # Abonelik (SubscriptionContext) ve geçmiş (HistoryContext)
│   ├── services/
│   │   ├── analyzeProduct.ts   # Backend'e istek atar, yoksa mock veri döner
│   │   └── mockAnalysis.ts     # Backend/API anahtarı yokken kullanılan örnek analiz
│   ├── types/                 # Ortak TypeScript tipleri
│   └── theme.ts               # Renk/spacing sabitleri
└── server/                   # AI analizini yapan basit Express backend (ayrı proje)
    └── README.md              # Backend kurulumu (ayrıca bakınız)
```

## Hızlı Başlangıç — Telefonunda Test Et (Expo Go)

Bilgisayarında Node.js kurulu olmalı (v18+). Sonra:

```bash
cd urun-analiz
npm install
npx expo start
```

Terminalde çıkan QR kodu, iPhone'unda **Expo Go** uygulamasıyla (App Store'dan
indirebilirsin) taratman yeterli. Uygulama telefonunda açılacak.

> **Önemli:** Bu proje bilinçli olarak **Expo SDK 54**'e sabitlendi. Apple, SDK 55
> ve sonrası için güncellenmiş Expo Go sürümlerini App Store'da henüz onaylamadığı
> için, App Store'dan indirilen Expo Go şu anda yalnızca SDK 54 (ve altı)
> projelerini açabiliyor. Daha yeni bir SDK ile denersen telefonunda "Project is
> incompatible with this version of Expo Go" hatası alırsın — bu senin/bizim
> hatamız değil, Apple'ın onay sürecinden kaynaklanıyor. Bu proje zaten SDK 54
> kullandığı için App Store'daki güncel Expo Go ile sorunsuz açılmalı;
> "Expo Go" uygulamasının en güncel sürümünün telefonunda kurulu olduğundan
> emin ol (App Store > Güncellemeler).
>
> İleride daha yeni bir Expo SDK'ya geçmek istersen (`npx expo install expo@latest`)
> ama Expo Go App Store'da henüz o SDK'yı desteklemiyorsa, alternatif olarak
> `eas go` (kendi Apple Developer hesabınla TestFlight üzerinden kişisel bir Expo
> Go build'i) ya da bir "development build" (`eas build`) kullanman gerekir.

> Şu anda hiçbir ek yapılandırma yapmasan bile uygulama **mock (örnek) analiz
> modunda** tam olarak çalışır: fotoğraf çek, "analiz ediliyor" akışını gör,
> örnek bir sonuç ekranı (içerik listesi, zararlı/faydalı bileşenler, kullanıcı
> yorumu özeti) gelir. Bu, backend/API anahtarı kurmadan önce akışı ve
> tasarımı test etmen için bilinçli olarak böyle bırakıldı.

## Gerçek AI Analizini Aktif Etme

Gerçek fotoğraflardan gerçek içerik analizi almak için basit bir backend'i
çalıştırman gerekiyor (Claude API'yi kullanıyor):

1. `server/README.md` dosyasındaki adımlarla backend'i kur ve çalıştır
   (bir Anthropic API anahtarı gerekir: https://console.anthropic.com/settings/keys).
2. Proje kökünde `.env.example` dosyasını `.env` olarak kopyala ve
   `EXPO_PUBLIC_API_URL` değerini backend adresinle doldur (örn.
   `http://192.168.1.23:3000` — telefon ve bilgisayar aynı Wi-Fi'de olmalı).
3. `npx expo start` komutunu yeniden başlat.

Backend'e ulaşılamazsa uygulama otomatik olarak mock veriye döner, yani hiçbir
zaman "kırık" bir ekranla karşılaşmazsın.

## Aylık Abonelik / Paywall

- `src/context/SubscriptionContext.tsx`: ücretsiz kullanıcılar için aylık 3
  tarama hakkı, hakkı dolunca "Premium'a Geç" ekranına yönlendirme. Ay
  değiştiğinde hak otomatik yenilenir.
- `src/screens/PaywallScreen.tsx`: örnek fiyatlandırma/özellik ekranı. Şu an
  "Abone Ol" butonu **gerçek ödeme almaz**, sadece yerelde "premium" bayrağını
  açan bir demodur.

### Gerçek ödeme/abonelik entegrasyonu için

Gerçek para tahsilatı Apple/Google'ın kendi altyapısı üzerinden yapılmalı
(uygulama içi satın alma zorunlu). Önerilen yol:

1. [RevenueCat](https://www.revenuecat.com/) hesabı aç (App Store Connect ve
   Google Play Console'da aylık abonelik ürününü tanımladıktan sonra).
2. `react-native-purchases` (RevenueCat SDK) paketini ekle — bu, Expo Go'da
   çalışmaz, bir "development build" (`eas build --profile development`)
   gerektirir.
3. `SubscriptionContext` içindeki `activatePremium`/`cancelPremium`
   fonksiyonlarını RevenueCat'in abonelik durumu callback'leriyle değiştir.

## Ürün Fikri Notları / Sonraki Adımlar

- **Barkod okuma**: `expo-camera`'nın barkod tarama özelliği eklenip INCI/EWG
  gibi kozmetik veritabanlarıyla eşleştirme yapılabilir — AI analizini
  doğrulamak/desteklemek için iyi bir katman olur.
- **Gerçek kullanıcı yorumları**: Şu an yorum özeti AI'nin genel bilgisine
  dayanıyor. Uygulama içi kendi puanlama/yorum sistemi eklenip zamanla organik
  veri biriktirilebilir; bu hem güvenilirliği artırır hem de "network effect"
  yaratarak abonelik değerini yükseltir.
- **Ürün geçmişi senkronizasyonu**: Şu an geçmiş taramalar sadece cihazda
  (AsyncStorage) saklanıyor. Kullanıcı hesabı + bulut senkronizasyonu (örn.
  Supabase/Firebase) eklenerek cihaz değişince veri kaybolmaz.
- **Android için de aynı kod çalışır**: Expo tek kod tabanıyla hem iOS hem
  Android'i destekler; App Store/Play Store'a yayınlamadan önce
  `eas build` ile native build alman gerekecek.

## Önemli Uyarı

Uygulamanın ürettiği "işe yarıyor mu / sağlıklı mı" analizleri yapay zeka
tarafından üretilir ve **tıbbi tavsiye yerine geçmez**. Ciltte/saçta ciddi bir
sorun varsa kullanıcıyı bir uzmana yönlendirmesi gerektiği hem prompt'ta hem
arayüzde (disclaimer alanı) hatırlatılıyor — bu ürünle ilgili yasal/etik
açıdan önemli bir noktadır, kaldırılmamalı.
