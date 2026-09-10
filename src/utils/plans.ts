// Premium plan fiyatlandırması — TEK YERDEN yönetiliyor (9 Eylül eklemesi:
// kullanıcı isteği "yıllık planı da koymayı unutma").
//
// ÖNEMLİ NOT (kullanıcı için): Aşağıdaki YILLIK fiyat şu an bir ÖRNEK/
// yer tutucu — aylık fiyatın (89,99 ₺ × 12 = 1079,88 ₺) üzerine kabaca
// %33'lük bir "yıllık indirim" uygulanarak hesaplandı. Bu, kesinlikle bir
// finansal tavsiye ya da kesin doğru fiyat DEĞİL — sadece tasarımda bir
// sayı olsun diye seçildi. Kendi maliyet/kâr hesabına göre bu sayıyı
// (aşağıdaki YEARLY_PRICE) değiştirebilirsin; tüm ekranlar buradan
// otomatik güncellenir.
export type PlanInterval = "monthly" | "yearly";

export const MONTHLY_PRICE = 89.99;

// Örnek/yer tutucu — yukarıdaki notu oku.
export const YEARLY_PRICE = 719.99;

export const YEARLY_MONTHLY_EQUIVALENT = YEARLY_PRICE / 12; // ≈ 59,99 ₺/ay
export const YEARLY_SAVINGS_PERCENT = Math.round(100 - (YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100); // ≈ %33

function formatTL(n: number): string {
  // Türkçe kesir ayracı (nokta yerine virgül) — "89,99 ₺" gibi.
  return `${n.toFixed(2).replace(".", ",")} ₺`;
}

export const PLAN_INFO: Record<
  PlanInterval,
  { label: string; price: number; priceLabel: string; periodLabel: string; renewalNote: string }
> = {
  monthly: {
    label: "Aylık",
    price: MONTHLY_PRICE,
    priceLabel: formatTL(MONTHLY_PRICE),
    periodLabel: "ay",
    renewalNote: "Her ay yenilenir, iptal edilebilir",
  },
  yearly: {
    label: "Yıllık",
    price: YEARLY_PRICE,
    priceLabel: formatTL(YEARLY_PRICE),
    periodLabel: "yıl",
    renewalNote: `Her yıl yenilenir, iptal edilebilir · aya bölününce ${formatTL(YEARLY_MONTHLY_EQUIVALENT)}/ay`,
  },
};

export function formatPrice(n: number): string {
  return formatTL(n);
}

export function addInterval(startISO: string, interval: PlanInterval): Date {
  const start = new Date(startISO);
  if (interval === "yearly") {
    return new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
  }
  return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
}
