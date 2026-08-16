// Open Beauty Facts (openbeautyfacts.org): kozmetik ürünler için ücretsiz, açık
// bir topluluk veritabanı. Aynı ekip Open Food Facts'i de işletiyor, API şeması
// aynı. Kapsam Türkiye pazarındaki ürünler için sınırlı olabilir — bu yüzden
// burada bulunamayan ürünler için server/src/analyze.js fotoğraf+AI akışına
// (analyzeProductImage) düşüyor.

const BASE_URL = "https://world.openbeautyfacts.org/api/v2/product";

/**
 * Barkodu Open Beauty Facts'te arar.
 * Bulunursa: { productName, brand, ingredientsText, imageUrl } döner.
 * Bulunamazsa ya da yeterli bilgi yoksa: null döner.
 */
async function lookupBarcode(barcode) {
  if (!barcode) return null;
  try {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(barcode)}.json`, {
      headers: {
        // Open Food Facts/Beauty Facts, isteklerin tanımlı bir User-Agent
        // göndermesini rica ediyor. HTTP header değerleri sadece ASCII
        // içerebilir (Türkçe karakter kullanma, yoksa fetch hata verir).
        "User-Agent": "UrunAnalizApp/1.0 (+https://github.com/) - personal care product analysis app",
      },
    });
    if (!res.ok) {
      console.warn(`[openBeautyFacts] Beklenmeyen HTTP durumu: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!data || data.status !== 1 || !data.product) return null;

    const p = data.product;
    const ingredientsText = p.ingredients_text_tr || p.ingredients_text_en || p.ingredients_text || "";
    const productName = p.product_name || p.product_name_tr || p.product_name_en || "";

    // Ne ürün adı ne içerik metni varsa, bu kayıt bize yeterince faydalı değil —
    // fotoğraf+AI akışına düşülmesi daha iyi.
    if (!productName && !ingredientsText) return null;

    return {
      productName: productName || null,
      brand: p.brands || null,
      ingredientsText,
      imageUrl: p.image_front_url || null,
    };
  } catch (err) {
    console.warn("[openBeautyFacts] Barkod sorgusu başarısız:", err.message);
    return null;
  }
}

module.exports = { lookupBarcode };
