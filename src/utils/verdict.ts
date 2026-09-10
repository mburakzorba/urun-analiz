import { colors } from "../theme";
import { ProductAnalysis } from "../types";

// 7 Eylül düzeltmesi — kullanıcı geri bildirimi (Android testinde fark
// edildi): ürünün "ASIL" puanı olarak ResultScreen'in büyük halkasında ve
// CompareScreen'de zaten sağlık + etkinlik ORTALAMASI kullanılıyordu (bkz.
// aşağıdaki usabilityZone/USABILITY_LABELS notu), ama Ana Sayfa ve Geçmiş
// listelerindeki rozet SADECE healthScore'u gösteriyordu — aynı ürün için
// iki farklı ekranda iki farklı sayı (ör. 65 vs 58) görünmesine yol
// açıyordu. Bu fonksiyon TEK kaynak: "ürünün puanı" olarak her yerde
// (Ana Sayfa, Geçmiş, Sonuç, Karşılaştır) hep bunu kullanıyoruz.
export function overallScore(p: Pick<ProductAnalysis, "healthScore" | "effectivenessScore">): number {
  return Math.round((p.healthScore + p.effectivenessScore) / 2);
}

// 0-100 arası sayısal skorları, kullanıcıya yanıltıcı bir "kesinlik" hissi
// vermeyen (örn. "62" gibi hassas görünen ama aslında AI tahmini olan bir
// sayı yerine) daha dürüst, kategorik bir değerlendirmeye çeviriyoruz.
// Sayısal skorlar (effectivenessScore/healthScore/averageSentiment) veri
// modelinde/backend'de duruyor (sıralama, geçmiş vb. için hâlâ faydalı),
// sadece kullanıcıya gösterirken bu etiketleri kullanıyoruz.

export type Verdict = { label: string; color: string };

function tier(score: number, good: string, mid: string, bad: string): Verdict {
  if (score >= 70) return { label: good, color: colors.secondary };
  if (score >= 45) return { label: mid, color: colors.warning };
  return { label: bad, color: colors.danger };
}

export function effectivenessVerdict(score: number): Verdict {
  return tier(score, "Muhtemelen İşe Yarar", "Sınırlı / Değişken Etki", "Zayıf Kanıt");
}

export function healthVerdict(score: number): Verdict {
  return tier(score, "Genel Olarak Güvenli", "Dikkat Gerektiren İçerik Var", "Riskli İçerik Mevcut");
}

// Home/History listelerindeki küçük rozet için tek kelimelik kısa özet.
export function shortHealthVerdict(score: number): Verdict {
  return tier(score, "İyi", "Orta", "Riskli");
}

// --- 5 aşamalı gösterge (gauge) sınıflandırmaları ---
// ResultScreen'deki ScoreGauge bileşeni için — "iyi/kötü" gibi düz bir ikili
// yerine, her biri ayrı bir kelimeyle adlandırılmış 5 kademeli bir skala.

function fiveTier(score: number, labels: [string, string, string, string, string], colors5: [string, string, string, string, string]): Verdict {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped < 20) return { label: labels[0], color: colors5[0] };
  if (clamped < 40) return { label: labels[1], color: colors5[1] };
  if (clamped < 60) return { label: labels[2], color: colors5[2] };
  if (clamped < 80) return { label: labels[3], color: colors5[3] };
  return { label: labels[4], color: colors5[4] };
}

// Tasarımdaki .track gradient'iyle birebir (kırmızı-kahve → turuncu →
// şeftali → açık zeytin → koyu zeytin) — GaugeTrack bileşeni bu renkleri
// LinearGradient olarak render ediyor, burada sadece knob/etiket rengi için
// kullanılıyor.
export const GAUGE_TRACK_COLORS: [string, string, string, string, string] = [
  "#A33B26",
  "#C4553B",
  "#E08A4E",
  "#AEBF92",
  "#728157",
];
const GAUGE_COLORS = GAUGE_TRACK_COLORS;

// Her gösterge için hem 5 kademenin isimleri (etiketler, barın altında HER
// kademenin altında tek tek gösteriliyor) hem de o isimlere göre skor→etiket
// eşleyen fonksiyon export ediliyor. Böylece ScoreGauge'a "labels" dizisini
// ayrıca yazmaya gerek kalmıyor, tek yerden (burada) yönetiliyor.

// "Genel Kullanılabilirlik" göstergesi — sağlık + gerçek etkinlik ortalaması.
// Bilinçli olarak "iyi/kötü" yerine tavsiye diline yakın, birbirinden ayrı
// isimler kullanıyoruz.
export const USABILITY_LABELS: [string, string, string, string, string] = [
  "Önerilmez",
  "Dikkatli Kullan",
  "Kararsız",
  "Önerilir",
  "Şiddetle Önerilir",
];
export function usabilityZone(score: number): Verdict {
  return fiveTier(score, USABILITY_LABELS, GAUGE_COLORS);
}

// "Kullanıcı Görüşü" göstergesi — reviewSummary.averageSentiment.
export const SENTIMENT_LABELS: [string, string, string, string, string] = [
  "Çok Olumsuz",
  "Olumsuz",
  "Karışık",
  "Olumlu",
  "Çok Olumlu",
];
export function sentimentZone(score: number): Verdict {
  return fiveTier(score, SENTIMENT_LABELS, GAUGE_COLORS);
}

// "İşe Yarıyor mu?" göstergesi — effectivenessScore. Eskiden 3 kademeli
// (VerdictCard) tek etiket olarak gösteriliyordu, şimdi diğerleriyle aynı
// görsel dile (5 kademeli gauge) taşındı.
export const EFFECTIVENESS_LABELS: [string, string, string, string, string] = [
  "Kanıt Yok",
  "Zayıf Kanıt",
  "Sınırlı Etki",
  "Muhtemelen İşe Yarar",
  "Güçlü Kanıt",
];
export function effectivenessZone(score: number): Verdict {
  return fiveTier(score, EFFECTIVENESS_LABELS, GAUGE_COLORS);
}

// "Sağlık" göstergesi — healthScore. Aynı şekilde 3 kademeliden 5 kademeliye
// taşındı.
export const HEALTH_LABELS: [string, string, string, string, string] = [
  "Yüksek Riskli",
  "Riskli",
  "Dikkat Gerekir",
  "Güvenli",
  "Çok Güvenli",
];
export function healthZone(score: number): Verdict {
  return fiveTier(score, HEALTH_LABELS, GAUGE_COLORS);
}
