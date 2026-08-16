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
  freeScansUsedThisMonth: number;
  freeScansLimit: number;
  currentPeriodStart: string; // ISO tarih, ayın başı
}
