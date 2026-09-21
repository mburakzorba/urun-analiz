# Hesap sistemi + yasal metinler + gerçek hatırlatma durumu — kurulum

Bu dosya, 16 Eylül'de eklenen şu değişiklikleri kapsıyor:

1. Bildirimler ekranındaki **sahte "örnek bildirimler" akışı kaldırıldı**, yerine gerçekten planlanmış bir sonraki hatırlatmanın tarihini gösteren bir durum kartı kondu.
2. **Gerçek Kullanım Koşulları ve Gizlilik Politikası** ekranları (Ayarlar > Yasal) — öncesinde ikisi de "yakında" diyordu.
3. **Gerçek hesap sistemi**: e-posta/şifre ile üye olma + giriş, Google ile giriş, çıkış yapma, hesabı kalıcı olarak silme. Öncesinde "E-posta ile giriş yap" sadece "yakında" diyen sahte bir butondu.

Hesap sistemi **Supabase Auth** üzerine kuruldu (kendi sunucumuzda auth sıfırdan yazmak yerine — çok daha güvenli ve hızlı). Kendi backend'imiz (Render'daki sunucun) sadece TEK bir yerde devreye giriyor: **hesap silme**, çünkü bu işlem gizli bir "service role" anahtarı gerektiriyor ve o anahtar uygulamanın içine asla konulamaz.

Aşağıdaki adımları sırayla yapman gerekiyor — yapmadan bu ekranlar "Hesap sistemi henüz kurulmadı" uyarısı gösterir, uygulamanın geri kalanı (tarama, analiz, abonelik) etkilenmez.

---

## 1. Supabase projesi oluştur (ücretsiz)

1. [supabase.com](https://supabase.com) → ücretsiz hesap aç, "New Project" ile bir proje oluştur (bölge olarak Avrupa'ya yakın bir yer seç, ör. Frankfurt).
2. Proje açıldıktan sonra sol menüden **Project Settings > API** sayfasına git.
3. Şunları not al:
   - **Project URL** (ör. `https://xxxxx.supabase.co`)
   - **anon public** anahtarı (uzun bir metin, bu GİZLİ DEĞİL — uygulamaya gömülecek)
   - **service_role** anahtarı ("Reveal"e basman gerekebilir) — bu GİZLİ, ASLA uygulamaya (client) konulmayacak, sadece Render'a.

## 2. E-posta ile giriş ayarları (Supabase tarafında)

Supabase panelinde **Authentication > Providers > Email** zaten varsayılan olarak açık. İki seçenek var:

- **E-posta onayı açık** (varsayılan, önerilir): kullanıcı üye olunca eline bir onay e-postası gelir, onaylamadan giriş yapamaz. Uygulama bu akışı zaten destekliyor ("E-postanı onayla" ekranı).
- **E-posta onayı kapalı**: test ederken daha hızlı olur ama üretimde önerilmez. Kapatmak istersen **Authentication > Providers > Email > Confirm email**'i kapat.

## 3. Google ile giriş kurulumu (Google Cloud Console + Supabase)

Bu kısım biraz daha uzun — dikkatli takip et:

### 3a. Google Cloud Console'da iki ayrı OAuth istemcisi oluştur

1. [console.cloud.google.com](https://console.cloud.google.com) → yeni bir proje aç (veya var olanı kullan).
2. **APIs & Services > OAuth consent screen**'i doldur (uygulama adı: "özünde", destek e-postası vb.) — "External" seç.
3. **APIs & Services > Credentials > Create Credentials > OAuth client ID**:
   - **Web application** tipi bir istemci oluştur (adı önemli değil, ör. "özünde web"). Oluşturunca çıkan **Client ID**'yi not al — bu, aşağıda `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` olacak.
   - **Android** tipi ayrı bir istemci daha oluştur:
     - Package name: `com.burakzorba3737.urunanaliz`
     - SHA-1 sertifika parmak izi: EAS'ın development/production keystore'unun SHA-1'i gerekiyor. Bunu almak için (proje klasöründe): `eas credentials` çalıştır, Android > (ilgili profil) seç, "SHA-1" değerini oradan kopyala. (Henüz bir keystore oluşturulmadıysa `eas build --profile development --platform android` ilk çalıştırmada birini otomatik oluşturur.)

### 3b. Supabase'e Google sağlayıcısını bağla

1. Supabase panelinde **Authentication > Providers > Google**'ı aç.
2. **Client ID** ve **Client Secret** alanlarına, 3a'da oluşturduğun **Web application** istemcisinin bilgilerini gir (Android istemcisinin değil — Supabase'in doğrulama akışı Web istemcisini kullanıyor).
3. Kaydet.

### 3c. Uygulamaya Web Client ID'yi ekle

Aşağıdaki adım 4'teki `.env` dosyasında `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` alanına 3a'daki **Web application** Client ID'sini yapıştıracaksın (Android istemcisinin ID'sini değil).

## 4. Uygulama tarafı `.env` dosyası

`urun-analiz` klasöründeki `.env` dosyanı aç (yoksa `.env.example`'ı kopyala) ve şunları doldur:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<adım 1'deki anon public anahtarı>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<adım 3a'daki Web application Client ID>
```

`EXPO_PUBLIC_API_URL` ve `EXPO_PUBLIC_APP_SECRET` zaten doluysa dokunmana gerek yok.

## 5. Backend (Render) tarafı — hesap silme için

Render panelinde backend servisinin **Environment** sekmesine git ve şu iki değişkeni ekle:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<adım 1'deki service_role anahtarı>
```

**ÖNEMLİ**: `SUPABASE_SERVICE_ROLE_KEY`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` ile AYNI şey değil — birbirine karıştırma. `service_role` anahtarı asla `EXPO_PUBLIC_...` olarak veya uygulama tarafına konulmamalı.

Render'a bu değişkenleri ekledikten sonra servis otomatik olarak yeniden deploy olur (veya manuel "Deploy latest commit" yapman gerekebilir).

## 6. `[E-POSTA ADRESİN]` alanlarını doldur

`src/screens/TermsScreen.tsx` ve `src/screens/PrivacyScreen.tsx` dosyalarının başında `CONTACT_EMAIL = "[E-POSTA ADRESİN]"` satırı var — buraya kullanıcıların gizlilik/hukuki sorular için ulaşabileceği gerçek bir e-posta adresi yaz (ör. destek e-postan).

## 7. Paketleri kur ve dev-client'ı yeniden derle

Bu delivery **iki yeni native modül** ekledi: `@react-native-google-signin/google-signin` ve (daha önceki teslimattan) `expo-notifications`. Bunlar Expo Go'da ÇALIŞMAZ — bir development build gerekiyor.

```bash
cd urun-analiz
npm install

cd server
npm install
```

Sonra Android dev-client'ı yeniden derle:

```bash
cd urun-analiz
eas build --profile development --platform android
```

Build bitince telefonuna/emülatöre kur, `npx expo start --dev-client` ile başlat.

## 8. Test sırası

1. Üye ol (e-posta/şifre) → e-posta onayı açıksa gelen kutunu kontrol et.
2. Giriş yap.
3. Ayarlar > Hesap'ta e-postanın göründüğünü doğrula.
4. Çıkış yap → tekrar giriş yap.
5. Google ile giriş dene (bu kısım en riskli — aşağıdaki notu oku).
6. Hesabımı sil'i dene (bir test hesabıyla) → Supabase panelinde **Authentication > Users**'da kullanıcının gerçekten silindiğini doğrula.
7. Ayarlar > Yasal'dan Kullanım Koşulları ve Gizlilik Politikası'nın açıldığını kontrol et.
8. Bildirimler ekranında, hatırlatmalar açıkken "Sıradaki hatırlatma planlandı" ve gerçek bir tarih gördüğünü doğrula.

---

## Önemli notlar

- **Google ile giriş, canlı test edemediğim tek kısım** — kodu Google'ın resmi/dokümante ettiği native akışa göre yazdım ama gerçek bir Google Cloud projesi + SHA-1 eşleşmesi olmadan test edilemiyor. İlk denemede bir hata alırsan (özellikle "DEVELOPER_ERROR" gibi), büyük ihtimalle SHA-1 parmak izi/paket adı Google Cloud Console'daki Android istemcisiyle eşleşmiyordur — bana hatayı gönderirsen birlikte çözeriz.
- **Hesap sistemi şu an sadece KİMLİK içindir, VERİ SENKRONU için değil.** Yani bir hesaba giriş yapmak, abonelik durumunu/analiz geçmişini/profil bilgilerini cihazlar arası TAŞIMIYOR — onlar hâlâ sadece o cihazda (AsyncStorage) tutuluyor. "Hesap değiştirme" isteğini şu an çıkış yapıp başka bir hesapla tekrar giriş yapma şeklinde karşıladım (ayrı bir "hesap değiştirici" ekranı yok). Cihazlar arası veri senkronu istersen bu ayrı, daha büyük bir iş — istersen bir sonraki adımda onu da yapabiliriz.
- **Yasal metinler** (Kullanım Koşulları, Gizlilik Politikası) taslak olarak yazıldı, uygulamanın GERÇEKTEN yaptığı şeylere göre (kodunu okuyarak) hazırlandı — ama hukuki bir belge oldukları için, özellikle KVKK/veri işleme ve yurt dışına aktarım kısımlarını yayına almadan önce bir avukata kontrol ettirmen önerilir.
