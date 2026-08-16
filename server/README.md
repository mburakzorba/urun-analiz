# Ürün Analiz — Backend

Bu klasör, mobil uygulamanın çektiği ürün fotoğrafını (ve varsa algılanan
barkodu) alıp analiz eden basit bir Express sunucusudur.

- `ANTHROPIC_API_KEY` tanımlıysa: fotoğraf/ürün bilgisi gerçekten Claude'a
  gönderilir, içerik/zararlı-faydalı bileşen analizi ve yorum özeti AI
  tarafından üretilir.
- `ANTHROPIC_API_KEY` tanımlı değilse: sunucu otomatik olarak örnek (mock) veri
  döner, böylece API anahtarın olmadan da uygulamanın uçtan uca akışını test
  edebilirsin.

## `/analyze` isteği nasıl işleniyor?

İstek bir `barcode` alanı içeriyorsa, sunucu şu sırayla ilerler (her adım bir
öncekinde sonuç bulunamazsa devreye girer):

1. **Paylaşımlı önbellek** (`src/productCache.js`) — bu barkod daha önce
   analiz edildiyse, AI'ye hiç sormadan aynı sonucu anında döner
   (`source: "cache"`).
2. **Open Beauty Facts** (`src/openBeautyFacts.js`) — ücretsiz, açık bir
   kozmetik ürün veritabanı. Barkod orada bulunursa, ürün adı/marka/içerik
   listesi doğrulanmış demektir; bu durumda fotoğraf Claude'a hiç
   gönderilmez (daha ucuz + daha güvenilir), sadece bilinen içerik metni
   yorumlanır (`source: "ai+barcode"`). Sonuç önbelleğe yazılır.
3. **Fotoğraf + AI** (mevcut akış) — barkod yoksa, ya da yukarıdaki iki adım
   sonuç vermezse (örn. Open Beauty Facts'te Türkiye'de satılan bir ürün
   kayıtlı değilse), çekilen fotoğraf doğrudan Claude'a gönderilip analiz
   edilir (`source: "ai"`). Bu sonuç önbelleğe YAZILMAZ, çünkü barkod
   olmadan "aynı ürün" olduğundan güvenle emin olamayız.

## Kurulum

```bash
cd server
npm install
cp .env.example .env
```

`.env` dosyasını aç ve `ANTHROPIC_API_KEY` alanına kendi anahtarını yapıştır.
Anahtarı https://console.anthropic.com/settings/keys adresinden alabilirsin.

## Çalıştırma

```bash
npm start
# veya değişiklikleri otomatik yansıtan geliştirme modu:
npm run dev
```

Sunucu varsayılan olarak `http://localhost:3000` adresinde çalışır.

Test etmek için:

```bash
curl http://localhost:3000/health

# Sadece fotoğraf (barkod yok):
curl -X POST http://localhost:3000/analyze -F "image=@/path/to/urun-foto.jpg"

# Fotoğraf + barkod (önce önbellek, sonra Open Beauty Facts denenir):
curl -X POST http://localhost:3000/analyze -F "image=@/path/to/urun-foto.jpg" -F "barcode=3600523459457"
```

## Mobil uygulamayı bu backend'e bağlama

Telefon (Expo Go) ve bilgisayarın aynı Wi-Fi ağındaysa, bilgisayarının yerel IP
adresini bul (`ipconfig` / `ifconfig`) ve proje kökündeki `.env` dosyasında
şunu ayarla:

```
EXPO_PUBLIC_API_URL=http://192.168.X.X:3000
```

Farklı ağlardaysanız (örn. backend'i deploy ettiysen) oradaki genel URL'yi kullan.

## Deploy (production için öneriler)

Bu basit Express sunucusunu ücretsiz/ucuz planlarla şu servislere kolayca
deploy edebilirsin: Render, Railway, Fly.io, veya bir VPS. Deploy ederken:

- `ANTHROPIC_API_KEY` ortam değişkenini deploy platformunun "Environment
  Variables" kısmına ekle (asla mobil uygulamaya veya repoya gömme).
- CORS ayarlarını üretimde daha sıkı hale getir (`cors()` şu an her origin'e
  izin veriyor, demo için uygundur).

## Önbelleği Veritabanına Taşıma (üretim için önemli)

`src/productCache.js` şu an `server/data/product-cache.json` dosyasına yazan
basit bir dosya-tabanlı önbellek. Bu, hiçbir ek servis kurmadan çalışması için
bilinçli bir tercih, ama iki önemli sınırı var:

1. Render/Railway gibi platformlarda "persistent disk" eklemediğin sürece,
   her deploy'da dosya sistemi sıfırlanır ve önbellek kaybolur.
2. Yüksek eşzamanlı trafikte (aynı anda çok sayıda yazma isteği) küçük bir
   race condition riski var.

Kullanıcı sayısı büyüdükçe bunun yerine gerçek bir veritabanına geçmen
öneriliyor — en kolay seçenek muhtemelen [Supabase](https://supabase.com)
(ücretsiz planı var, Postgres, basit bir JS istemcisi var). Geçiş, sadece
`productCache.js` içindeki `getCachedProduct`/`saveCachedProduct`
fonksiyonlarının içini değiştirmek kadar basit — dışarıdan çağrılma şekli
aynı kalabilir.

## Notlar / Sonraki Adımlar

- Şu an kullanıcı yorumu özeti modelin "genel bilgisine" dayanarak
  üretiliyor. Gerçek, güncel kullanıcı yorumlarını göstermek istersen: (1)
  uygulama içi kendi yorum/puanlama sistemini ekleyebilir, ve/veya (2) bir
  web arama/scraping entegrasyonu ekleyip o sonuçları modele bağlam olarak
  verebilirsin.
- Open Beauty Facts'in Türkiye'de satılan ürünler için veri kapsamı sınırlı
  olabilir (topluluk kaynaklı bir veritabanı) — barkod bulunamadığında
  fotoğraf+AI akışına düşülmesi bu yüzden önemli.
- Maliyet/kâr analizinde (bkz. sohbetteki Excel dosyası) önerilen bir diğer
  optimizasyon: ücretsiz kullanıcı taramalarında daha ucuz bir model (Claude
  Haiku 4.5), premium kullanıcı taramalarında Claude Sonnet 5 kullanmak. Bu
  henüz kodda yok — `ANTHROPIC_MODEL` şu an tüm istekler için tek bir model.
- Üretimde: rate limiting, istek başına görsel boyut sınırı (şu an 8MB),
  ve kullanıcı kimlik doğrulama eklemek isteyeceksin.
