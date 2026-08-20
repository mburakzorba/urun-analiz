// Paylaşımlı ürün önbelleği: bir barkod bir kez analiz edildikten sonra,
// başka bir kullanıcı aynı barkodu taradığında AI'ye tekrar sormadan aynı
// sonucu anında döndürüyoruz. Bu hem maliyeti düşürür hem tutarlılığı artırır.
//
// ÖNEMLİ — ÜRETİM NOTU: Bu basit bir dosya-tabanlı (JSON) önbellek. Tek
// sunucu/düşük-orta trafik için yeterli ve hiçbir ek servis kurmadan çalışır,
// ama:
//   1) Sunucu her redeploy edildiğinde dosya sistemi sıfırlanabilir (Render/
//      Railway gibi platformlarda "persistent disk" eklemediğin sürece).
//   2) Çok sayıda eşzamanlı yazma olursa (yüksek trafik) race condition
//      riski var (read-modify-write deseni).
// Gerçek ölçekte bunun yerine bir veritabanı (Postgres/Supabase gibi) kullan.
// Bkz. server/README.md > "Önbelleği Veritabanına Taşıma".

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const CACHE_FILE = path.join(DATA_DIR, "product-cache.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, "{}", "utf8");
}

function readAll() {
  ensureStore();
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    return JSON.parse(raw || "{}");
  } catch (err) {
    console.warn("[productCache] Önbellek dosyası okunamadı, boş önbellekle devam ediliyor:", err.message);
    return {};
  }
}

function getCachedProduct(barcode) {
  if (!barcode) return null;
  const all = readAll();
  return all[barcode] || null;
}

function saveCachedProduct(barcode, analysis) {
  if (!barcode) return;
  const all = readAll();
  // id/createdAt/imageUri gibi tarama-özel alanları önbelleğe yazmıyoruz,
  // çünkü her kullanıcının kendi fotoğrafı/isteği farklı olacak.
  const { id, createdAt, imageUri, ...cacheable } = analysis;
  all[barcode] = { ...cacheable, barcode, cachedAt: new Date().toISOString() };
  ensureStore();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(all, null, 2), "utf8");
}

// Ürün ADINI (barkod değil) önbellek anahtarına çevirir — büyük/küçük harf
// ve fazla boşluk farkları yüzünden aynı ürünün "farklı ürün" sanılıp
// önbellek ıskalanmasını önlemek için. Türkçe karakterlere duyarlı
// (toLocaleLowerCase("tr-TR") — "İ"/"I" harflerini doğru küçültür).
function normalizeProductKey(name) {
  return name.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

module.exports = { getCachedProduct, saveCachedProduct, normalizeProductKey };