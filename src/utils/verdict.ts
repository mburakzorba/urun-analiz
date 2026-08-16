import { colors } from "../theme";

// 0-100 arası sayısal skorları, kullanıcıya yanıltıcı bir "kesinlik" hissi
// vermeyen (örn. "62" gibi hassas görünen ama aslında AI tahmini olan bir
// sayı yerine) daha dürüst, kategorik bir değerlendirmeye çeviriyoruz.
// Sayısal skorlar (effectivenessScore/healthScore/averageSentiment) veri
// modelinde/backend'de duruyor (sıralama, geçmiş vb. için hâlâ faydalı),
// sadece kullanıcıya gösterirken bu etiketleri kullanıyoruz.

export type Verdict = { label: string; color: string };

function tier(score: number, good: string, mid: string, bad: string): Verdict {
  if (score >= 70) return { label: good, color: colors.primary };
  if (score >= 45) return { label: mid, color: colors.warning };
  return { label: bad, color: colors.danger };
}

export function effectivenessVerdict(score: number): Verdict {
  return tier(score, "Muhtemelen İşe Yarar", "Sınırlı / Değişken Etki", "Zayıf Kanıt");
}

export function healthVerdict(score: number): Verdict {
  return tier(score, "Genel Olarak Güvenli", "Dikkat Gerektiren İçerik Var", "Riskli İçerik Mevcut");
}

export function satisfactionVerdict(score: number): Verdict {
  return tier(score, "Kullanıcılar Genelde Memnun", "Karışık Yorumlar", "Genelde Memnuniyetsizlik");
}

// Home/History listelerindeki küçük rozet için tek kelimelik kısa özet.
export function shortHealthVerdict(score: number): Verdict {
  return tier(score, "İyi", "Orta", "Riskli");
}