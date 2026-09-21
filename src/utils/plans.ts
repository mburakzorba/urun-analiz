// Premium paket fiyatlandırması — TEK YERDEN yönetiliyor.
//
// 12 Eylül değişikliği (kullanıcı isteği — "farklı farklı premium paketler
// koyalım, isimler farklı olsun... ilk önce paketleri ve fiyatları
// ayarlayalım sonra uygulamaya ekleriz"): eskiden TEK bir "Premium" planı
// vardı (aylık/yıllık, sınırsız tarama + 300 taramalık "âdil kullanım"
// sınırı). Artık dört ayrı, adı ve aylık tarama KOTASI farklı paket var.
//
// 12 Eylül düzeltmesi (kullanıcı kâr/zarar hesaplayıcısında paketleri kendi
// eline alıp SON HALİNİ verdi — "paketler bunlar, eklediğim ve fiyatlarını
// değiştirdim, bunlar olucak"): aşağıdaki dört paket ve ek tarama paketi
// fiyatı artık TAMAMEN kullanıcının kendi belirlediği KESİN rakamlar (ilk
// turdaki gibi benim örnek/öneri rakamlarım değil):
//   - Başlangıç: 20 tarama/ay, 149 ₺
//   - Pro:       30 tarama/ay, 199 ₺
//   - Premium:   45 tarama/ay, 249 ₺
//   - Elite:     60 tarama/ay, 289 ₺
//   - Ek tarama paketi: +5 tarama, 29 ₺ (tek seferlik, abonelik değil)
// Hepsi burada, TEK yerden, istediğin gibi değiştirilebilir; tüm ekranlar
// (Paywall, Ödeme, Aboneliğim, Ana Sayfa, Profil, Ayarlar, Limit doldu)
// otomatik güncellenir.
//
// Yıllık plan bilerek bu turda YOK — dört paket + ek paket tasarımı
// tamamen aylık konuşuldu. İstersen ileride her pakete ayrı bir yıllık
// seçenek (ör. %25-33 indirimli) eklenebilir; PlanTier'a bir `yearlyPrice`
// alanı eklemek yeterli olur.
export type TierId = "baslangic" | "pro" | "premium" | "elite";

// 21 Eylül eklemesi (RevenueCat entegrasyonu): Google Play Console'da bu 4
// paket, TEK bir abonelik ürünü ("ozunde_premium") altında 4 farklı "temel
// plan" (base plan) olarak oluşturulacak — Play Console'un yeni abonelik
// modeli, aynı ürün altında birden çok temel plan/fiyat kademesi tanımlamaya
// izin veriyor (kullanıcı paketler arası geçiş yaptığında bu, Google'ın kendi
// "plan değişikliği" akışını kullanabilmesini de sağlıyor). RevenueCat/Play
// Billing bu paketi "ozunde_premium:baslangic-aylik" gibi TEK bir ürün
// kimliğiyle (productId) görür — bkz. services/purchases.ts.
//
// ÖNEMLİ: Play Console'da bu temel planlar OLUŞTURULMADAN (ve yayınlanmadan)
// önce productId'ler Play Billing'de "bulunamaz" hatası verir — bu normal,
// henüz o adıma gelmedik (bkz. teslimat notları).
export const PLAY_SUBSCRIPTION_ID = "ozunde_premium";

export interface PlanTier {
  id: TierId;
  name: string;
  scansPerMonth: number;
  price: number; // ₺/ay
  priceLabel: string;
  // Paywall kartında fiyatın altında görünen tek satırlık özet.
  tagline: string;
  // Bir kartı öne çıkarmak için opsiyonel rozet (ör. "En popüler").
  badge?: string;
  // Google Play Console'da bu paket için oluşturulacak "temel plan" (base
  // plan) kimliği — sadece PLAY_SUBSCRIPTION_ID ile birlikte anlamlı.
  basePlanId: string;
  // RevenueCat/Play Billing'in bu paketi tanıdığı TAM ürün kimliği
  // ("<abonelik>:<temel plan>"). purchaseTier() bunu kullanır.
  productId: string;
}

function formatTL(n: number): string {
  // Türkçe kesir ayracı (nokta yerine virgül) — "149,00 ₺" yerine tam sayıysa
  // "149 ₺" gösterelim, ondalıklıysa (ör. ek paket 39,00) yine tam sayı kalır
  // zaten — ama fonksiyon genel kalsın diye ondalığı koruyoruz.
  const hasDecimals = Math.round(n * 100) % 100 !== 0;
  return hasDecimals ? `${n.toFixed(2).replace(".", ",")} ₺` : `${Math.round(n)} ₺`;
}

export const TIERS: PlanTier[] = [
  {
    id: "baslangic",
    name: "Başlangıç",
    scansPerMonth: 20,
    price: 149,
    priceLabel: formatTL(149),
    tagline: "Ara sıra tarayanlar için",
    basePlanId: "baslangic-aylik",
    productId: `${PLAY_SUBSCRIPTION_ID}:baslangic-aylik`,
  },
  {
    id: "pro",
    name: "Pro",
    scansPerMonth: 30,
    price: 199,
    priceLabel: formatTL(199),
    tagline: "Düzenli kullananlar için",
    badge: "En popüler",
    basePlanId: "pro-aylik",
    productId: `${PLAY_SUBSCRIPTION_ID}:pro-aylik`,
  },
  {
    id: "premium",
    name: "Premium",
    scansPerMonth: 45,
    price: 249,
    priceLabel: formatTL(249),
    tagline: "Sık kullananlar için",
    basePlanId: "premium-aylik",
    productId: `${PLAY_SUBSCRIPTION_ID}:premium-aylik`,
  },
  {
    id: "elite",
    name: "Elite",
    scansPerMonth: 60,
    price: 289,
    priceLabel: formatTL(289),
    tagline: "Yoğun kullananlar için",
    basePlanId: "elite-aylik",
    productId: `${PLAY_SUBSCRIPTION_ID}:elite-aylik`,
  },
];

export const DEFAULT_TIER_ID: TierId = "pro";

export function getTier(id: TierId): PlanTier {
  return TIERS.find((t) => t.id === id) || TIERS[0];
}

// 21 Eylül eklemesi: RevenueCat'ten dönen bir satın alımın (entitlement'ın)
// productIdentifier'ından, bunun hangi PAKETE (TierId) karşılık geldiğini
// bulur. Eşleşme yoksa (ör. eski/silinmiş bir ürün kimliği) undefined döner.
export function getTierByProductId(productId: string | undefined | null): PlanTier | undefined {
  if (!productId) return undefined;
  return TIERS.find((t) => t.productId === productId);
}

// En düşük fiyatlı paket — Paywall'a çıkmadan önceki ekranlarda (ör.
// ProfileScreen, LimitReachedScreen) "X ₺'den başlayan fiyatlarla" gibi
// TEK bir tanıtım rakamı gösterilmek istendiğinde kullanılıyor.
export const CHEAPEST_TIER: PlanTier = TIERS.reduce((min, t) => (t.price < min.price ? t : min), TIERS[0]);

// --- Ek tarama paketi (top-up) — abonelik DEĞİL, tek seferlik satın alma ---
// Satın alınan ekstra taramalar aya bağlı değil: kullanılana kadar (veya
// hesapta) kalır, ay değişince ücretsiz/paket kotası gibi sıfırlanmaz.
export interface AddonPack {
  id: string;
  name: string;
  extraScans: number;
  price: number; // ₺, tek seferlik
  priceLabel: string;
  // Google Play Console'da bu paket için oluşturulacak, tek seferlik
  // (tüketilebilir/consumable) uygulama içi ürünün kimliği. NOT: Play Store
  // ürün kimlikleri tire (-) KABUL ETMEZ (sadece küçük harf, rakam, alt
  // çizgi, nokta) — bu yüzden yukarıdaki "id" alanından (uygulama içi genel
  // kimlik) kasıtlı olarak farklı/ayrı tutuluyor.
  productId: string;
}

export const ADDON: AddonPack = {
  id: "ek-5-tarama",
  name: "Ek 5 Tarama",
  extraScans: 5,
  price: 29,
  priceLabel: formatTL(29),
  productId: "ek_5_tarama",
};

export function formatPrice(n: number): string {
  return formatTL(n);
}

export function addOneMonth(startISO: string): Date {
  const start = new Date(startISO);
  return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
}
