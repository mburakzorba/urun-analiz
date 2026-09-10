// Uygulama genelinde kullanılan tip tanımları

export type IngredientRisk = "iyi" | "orta" | "riskli";

export interface AnalyzedIngredient {
  name: string;
  risk: IngredientRisk;
  explanation: string;
}

export interface ReviewSummary {
  averageSentiment: number; // 0-100 arası, ne kadar olumlu bulunduğu
  totalMentionsAnalyzed: number;
  positiveHighlights: string[];
  negativeHighlights: string[];
  sampleQuotes: { text: string; sentiment: "olumlu" | "olumsuz" | "nötr" }[];
}

export interface ProductAnalysis {
  id: string;
  createdAt: string;
  imageUri: string;
  productName: string;
  brand?: string;
  category?: string;
  effectivenessScore: number; // 0-100: "gerçekten işe yarıyor mu"
  effectivenessSummary: string;
  healthScore: number; // 0-100: genel sağlık/güvenlik skoru
  ingredients: AnalyzedIngredient[];
  harmfulIngredients: AnalyzedIngredient[];
  beneficialIngredients: AnalyzedIngredient[];
  reviewSummary: ReviewSummary;
  // Ürünün ne sıklıkla / nasıl kullanılması gerektiğine dair kısa öneri
  // (örn. "Haftada 2-3 kez, akşam temizlenmiş cilde uygulanır.").
  usageFrequency?: string;
  // Kullanıcı profili (cilt tipi/hedefler/alerjiler) doldurulmuşsa, o profile
  // özel üretilmiş kısa değerlendirme (örn. "Belirttiğin parfüm alerjine
  // takılan bir bileşen içeriyor"). Profil yoksa boş/undefined kalır.
  personalizedNote?: string;
  disclaimer: string;
  // ai: sadece fotoğraftan AI tahmini · mock: örnek/demo veri
  // ai+barcode: barkodla Open Beauty Facts'ten doğrulanmış ürün bilgisi + AI değerlendirmesi
  // cache: daha önce aynı barkod için üretilmiş sonuç, tekrar AI'ye sorulmadan döndürüldü
  source: "ai" | "mock" | "ai+barcode" | "cache";
  barcode?: string;
  cachedAt?: string;
}

export interface SubscriptionState {
  isPremium: boolean;
  // Bu ay yapılan TÜM taramalar (Premium dahil) — Premium kullanıcılarda
  // "âdil kullanım" sınırını (aşırı/kötüye kullanım) tespit etmek için de
  // kullanılıyor, sadece ücretsiz plan sayacı değil.
  scansUsedThisMonth: number;
  freeScansLimit: number;
  currentPeriodStart: string; // ISO tarih, ayın başı
  // 9 Eylül eklemesi: hangi plana abone olundu (aylık/yıllık) — sadece
  // isPremium true ise anlamlı. Premium olmayan/eski kayıtlarda yok
  // olabilir; ekranlar bu durumda "monthly" varsayıyor (bkz. plans.ts).
  planInterval?: "monthly" | "yearly";
}

// --- Kullanıcı Profili (kişiselleştirme) ---
// Kullanıcının cilt/saç tipi, hedefleri ve bilinen alerjileri — her analiz
// isteğiyle birlikte backend'e gönderilip AI'nin değerlendirmeyi bu kişiye
// özel yapması (personalizedNote) için kullanılır. Tamamen opsiyoneldir;
// kullanıcı doldurmazsa uygulama normal (genel) analiz döndürmeye devam eder.

export type SkinType = "Yağlı" | "Kuru" | "Karma" | "Hassas" | "Normal";

export const SKIN_TYPES: SkinType[] = ["Yağlı", "Kuru", "Karma", "Hassas", "Normal"];

// "Ne İstiyorsun?" (hedefler) alanı kaldırıldı — artık bu bilgi her taramada
// (ScanScreen'deki "Bu ürünü ne için kullanmak istiyorsun?" seçenekleri ile)
// o taramaya özel olarak soruluyor, profilde genel/statik tutmaya gerek yok.
// Yerine, taramaların büyük kısmının saç bakım ürünleri olması nedeniyle,
// cilt tipine paralel bir "Saç Tipin" sorusu eklendi.
export type HairType = "Yağlı" | "Kuru" | "Normal" | "Karma" | "Kepekli / Hassas Saç Derisi";

export const HAIR_TYPES: HairType[] = ["Yağlı", "Kuru", "Normal", "Karma", "Kepekli / Hassas Saç Derisi"];

// Kozmetik ürünlerde en sık alerji/duyarlılığa yol açan bileşen grupları.
export const COMMON_ALLERGENS: string[] = [
  "Parfüm / Koku (Fragrance-Parfum)",
  "Sülfatlar (SLS/SLES)",
  "Parabenler",
  "Alkol (Denatured Alcohol)",
  "Formaldehit Salıcılar",
  "Lanolin",
  "Nikel",
  "Esansiyel Yağlar (ör. Çay Ağacı, Nane)",
];

// 9 Eylül eklemesi (kullanıcı isteği — "profilim kısmı eksik yaş isim
// soyisim cinsiyet sorusuda olsun"): bu 4 alan da diğerleri gibi TAMAMEN
// opsiyonel. Şu an için hiçbir analiz/personalizedNote mantığı bu alanları
// KULLANMIYOR — sadece kullanıcının kendi profilini tanımlaması için.
// (İleride yaş/cinsiyete göre de kişiselleştirme eklenmek istenirse,
// server/src/prompt.js'e bu alanlar da eklenebilir.)
export type Gender = "Kadın" | "Erkek" | "Belirtmek istemiyorum";

export const GENDERS: Gender[] = ["Kadın", "Erkek", "Belirtmek istemiyorum"];

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: Gender;
  skinType?: SkinType;
  hairType?: HairType;
  allergies: string[]; // COMMON_ALLERGENS içinden seçilenler
  otherAllergyNote?: string; // serbest metin — listede olmayan alerjiler
  completedAt?: string; // profil ilk kez dolduğunda ISO tarih
}

export const EMPTY_USER_PROFILE: UserProfile = {
  allergies: [],
};
