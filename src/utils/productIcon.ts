// 11 Eylül eklemesi (kullanıcı isteği — "ürünün sol kısmında kare boş kutu
// var, ürün ne ile ilgili olursa onunla ilgili bir ikon koyalım: ruj ise ruj,
// parfümse parfüm, krem ise krem ikonu"): Ana Sayfa'daki "Son analizler"
// listesinde ve Sonuç ekranının başlığında, ürünün fotoğrafı yerine (ki bu
// yerel dosya URI'si cihaz/uygulama güncellemesi sonrası geçersiz kalabilir)
// KATEGORİYE göre değişen, temiz/tutarlı bir çizgi ikon gösteriyoruz.
//
// analysis.category tamamen AI'nin ürettiği ÖZGÜR metin (örn. "Deodorant
// Spreyi / Vücut Spreyi", "Ruj", "Yüz Kremi") — bu yüzden sabit bir liste
// değil, anahtar kelime eşleştirmesi kullanıyoruz. Hiçbir anahtar kelime
// eşleşmezse, kişisel bakım ürünlerinin büyük kısmını temsil eden genel bir
// "şişe" ikonuna düşüyoruz (BottleIcon) — boş kutudan HER ZAMAN daha iyi.

export type ProductIconKey = "lipstick" | "perfume" | "cream" | "bottle" | "soap" | "dropper";

// Türkçe karakterleri sadeleştirip küçük harfe çeviriyoruz ki "Şampuan" da
// "sampuan" da "şampuan" da aynı şekilde eşleşsin (AI çıktısı bazen aksansız
// gelebiliyor).
function normalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o");
}

// Sıra ÖNEMLİ: daha spesifik anahtar kelimeler önce kontrol ediliyor (örn.
// "saç kremi" içinde "krem" geçse de önce "saç" eşleşip "bottle"a düşmeli).
const RULES: { key: ProductIconKey; keywords: string[] }[] = [
  { key: "lipstick", keywords: ["ruj", "lipstick", "dudak"] },
  { key: "dropper", keywords: ["serum", "seru m", "damla", "ampul", "dropper"] },
  { key: "soap", keywords: ["sabun", "soap"] },
  { key: "perfume", keywords: ["parfum", "deodorant", "sprey", "spray", "koku", "kolonya"] },
  { key: "bottle", keywords: ["sampuan", "sac", "conditioner", "jel", "gel", "dus"] },
  { key: "cream", keywords: ["krem", "losyon", "lotion", "nemlendirici", "cream", "vucut sutu", "yag", "balsam"] },
];

export function getProductIconKey(category?: string, productName?: string): ProductIconKey {
  const text = normalize(`${category || ""} ${productName || ""}`);
  for (const rule of RULES) {
    if (rule.keywords.some((k) => text.includes(k))) return rule.key;
  }
  return "bottle";
}
