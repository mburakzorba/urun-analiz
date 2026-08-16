# Backend'i Render'a Deploy Etme — Adım Adım Rehber

Bu rehber, `server/` klasöründeki backend'i internete açıp uygulamayı ona
bağlamanı sağlıyor. Bitince artık mock veri değil, gerçek AI analizi
göreceksin. Toplam süre ~15-20 dakika, hiçbir ödeme bilgisi girmen gerekmiyor
(Render'ın ücretsiz planıyla başlayacağız).

Proje zip'ini açtığında içinde zaten hazır bir git deposu var (`git log` ile
görebilirsin), yani doğrudan 2. adımdan başlayabilirsin.

## 1) (Gerekirse) Git deposu hazırla

Zip'i açtıysan bu adım muhtemelen gerekmiyor — proje klasöründe `git status`
çalıştırıp "nothing to commit" görüyorsan 2. adıma geç.

```bash
cd urun-analiz
git init
git add -A
git commit -m "İlk sürüm"
```

## 2) Kodu GitHub'a yükle

Render, kodu bir GitHub deposundan çekiyor.

1. https://github.com/new adresinden yeni, **boş** bir repo oluştur (README/
   .gitignore ekleme, zaten var).
2. Terminalde:

```bash
git remote add origin https://github.com/mburakzorba/urun-analiz.git
git branch -M main
git push -u origin main
```

(`KULLANICI_ADIN` kısmını kendi GitHub kullanıcı adınla değiştir.)

## 3) Anthropic API anahtarı al

1. https://console.anthropic.com adresine git, hesap oluştur/giriş yap.
2. Sol menüden **API Keys** → **Create Key**.
3. Oluşan anahtarı bir yere kopyala (bir daha tam haliyle gösterilmeyecek).
4. Hesabına biraz kredi yüklemen gerekebilir (Anthropic Console >
   Billing) — bu uygulamanın maliyeti çok düşük, bkz. sohbetteki Excel
   dosyası (tarama başına ~₺0,34-0,67).

## 4) Render'da deploy et

1. https://render.com adresinde ücretsiz hesap oluştur (GitHub ile giriş
   yapabilirsin, bu GitHub deponu bağlamayı da kolaylaştırır).
2. Dashboard'da **New +** → **Blueprint**.
3. Az önce push ettiğin `urun-analiz` deposunu seç. Render, projedeki
   `render.yaml` dosyasını otomatik bulup okuyacak (backend'in `server/`
   klasöründe olduğunu, nasıl build/start edileceğini zaten biliyor).
4. Render sana `ANTHROPIC_API_KEY` için bir değer soracak — 3. adımda
   aldığın anahtarı yapıştır.
5. **Apply**'a bas. İlk deploy birkaç dakika sürer, loglardan takip
   edebilirsin.
6. Deploy bitince Render sana bir adres verecek, örneğin:
   `https://urun-analiz-backend.onrender.com`

Kontrol için tarayıcıda `https://urun-analiz-backend.onrender.com/health`
adresine git — `{"ok":true,"hasApiKey":true}` görmelisin. `hasApiKey:false`
görüyorsan API anahtarı doğru girilmemiş demektir, Render Dashboard >
servisin > **Environment** sekmesinden kontrol et.

> **Not:** Ücretsiz plan 15 dakika kullanılmayınca uykuya dalıyor, ilk
> istekte ~1 dakika uyanma süresi olabilir — normal, bir daha istekte hızlı
> yanıt verir. Ayrıca ücretsiz planda dosya sistemi her yeniden
> başlatmada sıfırlanıyor, yani ürün önbelleği (`server/data/`) sık sık
> boşalabilir — test aşamasında sorun değil, gerçek kullanıcı olunca
> `server/README.md`'deki veritabanı geçişini uygula.

## 5) Uygulamayı bu backend'e bağla

Proje kökünde `.env.example` dosyasını `.env` olarak kopyala:

```bash
cp .env.example .env
```

`.env` içine Render'dan aldığın adresi yaz:

```
EXPO_PUBLIC_API_URL=https://urun-analiz-backend.onrender.com
```

Sonra:

```bash
npx expo start --clear
```

QR kodu Expo Go ile tekrar taratıp bir ürün fotoğrafı çek — bu sefer sonuç
ekranında "Örnek analiz (demo verisi)" yerine **"AI tahmini (fotoğraftan)"**
rozetini görmelisin. Bir de gerçek bir ürünün barkodunu göstermeyi dene;
Open Beauty Facts'te varsa "✓ Barkodla doğrulanmış ürün" rozetini
göreceksin.

## Sorun mu yaşıyorsun?

- **`hasApiKey:false`** → Render'da Environment sekmesinden
  `ANTHROPIC_API_KEY`'in doğru girildiğini kontrol et, gerekirse servisi
  "Manual Deploy" ile yeniden başlat.
- **Uygulama hâlâ mock veri gösteriyor** → `.env` dosyasındaki
  `EXPO_PUBLIC_API_URL` doğru mu, `npx expo start` komutunu `--clear`
  bayrağıyla yeniden başlattın mı kontrol et (Expo bazen env
  değişikliklerini cache'leyebiliyor).
- **İlk istek çok yavaş / zaman aşımına uğruyor** → Ücretsiz plan uykudan
  uyanıyor olabilir, 30-60 saniye bekleyip tekrar dene.
