const Anthropic = require("@anthropic-ai/sdk");
const {
  SYSTEM_PROMPT,
  USER_PROMPT,
  USER_PROMPT_TWO_IMAGES,
  USER_PROMPT_TWO_IMAGES_BOTH_INGREDIENTS,
  KNOWN_PRODUCT_SYSTEM_PROMPT,
  buildKnownProductUserPrompt,
  buildProfileBlock,
} = require("./prompt");
const { getMockAnalysis } = require("./mockAnalysis");

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/**
 * Model yanıtı max_tokens sınırına takılıp JSON'un ortasında kesildiğinde
 * (örn. bir string'in ya da dizinin tam bitmemesi), elden geldiğince
 * kurtarma yapar: açık kalan string'i kapatır, yarım kalan son elemanı atar,
 * açık kalan {/[ parantezlerini doğru sırayla kapatır. Böylece max_tokens'a
 * takılan bir cevaptan bile eksik ama GEÇERLİ bir sonuç çıkarabiliyoruz —
 * tamamen mock'a düşmek yerine (mock'a düşmek, kullanıcının hep aynı "örnek
 * analiz"i görmesine yol açıyordu).
 */
function repairTruncatedJson(text) {
  const stack = [];
  let inString = false;
  let escape = false;
  let lastSafeCut = -1; // en son tamamlanmış eleman/alanın hemen sonrası (bir virgül)
  let lastSafeStack = null; // o an açık olan {/[ yığınının anlık kopyası

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
    else if (ch === "," && stack.length > 0) {
      lastSafeCut = i;
      lastSafeStack = stack.slice(); // ÖNEMLİ: bu andaki yığın durumunun kopyası
    }
  }

  if (stack.length === 0) return null; // zaten dengeli — sorun kesilme değil, başka bir şey

  // Kesildiği an bir string'in ortasındaysak ya da tam bir elemanın (sayı,
  // obje, dizi) ortasındaysak, son "güvenli" virgüle geri dönüyoruz. Kapanış
  // parantezlerini de O ANDAKİ yığın durumuna göre hesaplamak gerekiyor —
  // metnin sonundaki yığın durumu değil, çünkü kesme noktasından sonra
  // (attığımız kısımda) başka parantezler açılmış olabilir.
  let cut, stackAtCut;
  if (!inString && lastSafeCut === -1) {
    // Ne string ortasındayız ne de daha önce güvenli bir virgül gördük
    // (örn. ilk alanın ortasında kesilmiş) — kurtaracak bir şey yok.
    return null;
  } else if (inString || lastSafeCut !== -1) {
    // Varsayılan: en son güvenli virgüle geri dön (en sağlam seçenek).
    cut = lastSafeCut;
    stackAtCut = lastSafeStack;
  }
  if (cut === -1 || !stackAtCut) return null;

  const truncated = text.slice(0, cut).replace(/,\s*$/, "");
  let closing = "";
  for (let i = stackAtCut.length - 1; i >= 0; i--) {
    closing += stackAtCut[i] === "{" ? "}" : "]";
  }

  try {
    return JSON.parse(truncated + closing);
  } catch (_) {
    return null;
  }
}

/**
 * Bir JSON string'i, model bazen kod bloğu ya da ekstra metin eklese bile
 * güvenli şekilde çıkarmaya çalışır.
 */
function extractJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // ```json ... ``` bloklarını ya da metin içindeki ilk { ... } bloğunu bul
    const match = trimmed.match(/\{[\s\S]*\}/);
    const candidate = match ? match[0] : trimmed;
    try {
      return JSON.parse(candidate);
    } catch (_) {
      const repaired = repairTruncatedJson(candidate);
      if (repaired) {
        console.warn("[analyze] Model yanıtı yarıda kesilmişti, kısmi veriyle onarıldı.");
        return repaired;
      }
      throw new Error("Model yanıtından JSON çıkarılamadı");
    }
  }
}

// repairTruncatedJson ile kurtarılan bir sonuçta bazı alanlar eksik kalmış
// olabilir (örn. dizi ortasında kesildiyse o dizinin geri kalanı ya da
// sonraki alanlar hiç yok). ResultScreen'in çökmemesi için (örn. eksik bir
// diziye .map çağrılması) makul varsayılanlarla dolduruyoruz.
function withSafeDefaults(parsed) {
  // Geçerli bir bileşen satırı mı? (kesilme sonrası yarım objeler gelebilir)
  const seenNames = new Set();
  const validIngredients = (Array.isArray(parsed.ingredients) ? parsed.ingredients : []).filter((i) => {
    if (!i || typeof i.name !== "string" || !i.name.trim()) return false;
    // Aynı isim iki kez gelirse arayüzde tekrar eden satır/duplicate key
    // oluşmasın diye ilkini tutuyoruz.
    const key = i.name.trim().toLowerCase();
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });

  // harmfulIngredients / beneficialIngredients artık modelden İSTENMİYOR —
  // ingredients listesinin tekrarıydılar ve yanıtı gereksiz uzatıp
  // max_tokens sınırına takılmasına yol açıyorlardı. Bunun yerine burada,
  // risk seviyesine göre kendimiz ayırıyoruz. (Model eski şemayla yanıt
  // verirse onu da kabul ediyoruz — geriye dönük uyumluluk.)
  const harmful = Array.isArray(parsed.harmfulIngredients) && parsed.harmfulIngredients.length
    ? parsed.harmfulIngredients
    : validIngredients.filter((i) => i.risk === "riskli" || i.risk === "orta");
  const beneficial = Array.isArray(parsed.beneficialIngredients) && parsed.beneficialIngredients.length
    ? parsed.beneficialIngredients
    : validIngredients.filter((i) => i.risk === "iyi");

  return {
    productName: parsed.productName || "Ürün",
    brand: parsed.brand || "Bilinmiyor",
    category: parsed.category || "",
    effectivenessScore: typeof parsed.effectivenessScore === "number" ? parsed.effectivenessScore : 50,
    effectivenessSummary: parsed.effectivenessSummary || "",
    healthScore: typeof parsed.healthScore === "number" ? parsed.healthScore : 50,
    ingredients: validIngredients,
    harmfulIngredients: harmful,
    beneficialIngredients: beneficial,
    reviewSummary: {
      averageSentiment: typeof parsed.reviewSummary?.averageSentiment === "number" ? parsed.reviewSummary.averageSentiment : 50,
      totalMentionsAnalyzed:
        typeof parsed.reviewSummary?.totalMentionsAnalyzed === "number" ? parsed.reviewSummary.totalMentionsAnalyzed : 0,
      positiveHighlights: Array.isArray(parsed.reviewSummary?.positiveHighlights) ? parsed.reviewSummary.positiveHighlights : [],
      negativeHighlights: Array.isArray(parsed.reviewSummary?.negativeHighlights) ? parsed.reviewSummary.negativeHighlights : [],
      sampleQuotes: Array.isArray(parsed.reviewSummary?.sampleQuotes) ? parsed.reviewSummary.sampleQuotes : [],
    },
    usageFrequency: parsed.usageFrequency || "",
    personalizedNote: parsed.personalizedNote || "",
    disclaimer:
      parsed.disclaimer ||
      "Bu analiz yapay zeka tarafından üretilmiştir ve tıbbi tavsiye yerine geçmez; ayrıca yanıt beklenenden uzun olduğu için bazı bölümler eksik olabilir.",
  };
}

// Sistem talimatlarımız (SYSTEM_PROMPT / KNOWN_PRODUCT_SYSTEM_PROMPT) HER
// istekte birebir aynı — hiç değişmiyor (~2000+ token). Anthropic'in "prompt
// caching" özelliğiyle bunu işaretlersek, art arda gelen isteklerde bu kısım
// için normal fiyatın çok altında (yaklaşık %90 indirimli) ödeme yapıyoruz —
// içerik/davranış hiç değişmiyor, sadece maliyet düşüyor. cache_control
// eklemek için system parametresini düz string yerine bir blok dizisi olarak
// vermemiz gerekiyor.
function cachedSystemPrompt(text) {
  return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
}

function extractTextBlock(response) {
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) throw new Error("Modelden metin yanıtı alınamadı");
  return textBlock.text;
}

// Claude Sonnet 5 fiyatlandırması — milyon token (MTok) başına USD.
// KAYNAK: platform.claude.com/docs/en/about-claude/pricing (kontrol tarihi:
// 19 Ağustos 2026). Anthropic fiyat değiştirirse burayı da güncellemek
// gerekir — kod içinde otomatik güncellenmiyor.
const PRICE_PER_MTOK_USD = {
  input: 2, // önbelleğe alınmamış (taze) girdi token'ı
  output: 10,
  cacheWrite5m: 2.5, // sistem promptu ilk kez (ya da 5 dk'dan sonra tekrar) önbelleğe yazılırken
  cacheRead: 0.2, // sistem promptu önbellekten okunduğunda (5 dk içinde art arda istek)
};

/**
 * Her istekten sonra GERÇEK token kullanımını ve o isteğin GERÇEK USD
 * maliyetini Render loglarına yazar. Tahmini bir hesap değil — Anthropic'in
 * response.usage alanındaki kesin sayılardan hesaplanıyor. "Ürün başına
 * maliyet nedir" sorusunun cevabı burada: bir tarama yaptıktan sonra Render
 * Dashboard → Logs'ta "[analyze][maliyet]" ile başlayan satırı ara.
 */
function logUsageAndCost(response, label) {
  const u = response.usage || {};
  const inputTokens = u.input_tokens || 0;
  const outputTokens = u.output_tokens || 0;
  const cacheWriteTokens = u.cache_creation_input_tokens || 0;
  const cacheReadTokens = u.cache_read_input_tokens || 0;

  const costUsd =
    (inputTokens / 1_000_000) * PRICE_PER_MTOK_USD.input +
    (outputTokens / 1_000_000) * PRICE_PER_MTOK_USD.output +
    (cacheWriteTokens / 1_000_000) * PRICE_PER_MTOK_USD.cacheWrite5m +
    (cacheReadTokens / 1_000_000) * PRICE_PER_MTOK_USD.cacheRead;

  console.log(
    `[analyze][maliyet] ${label} — girdi(taze):${inputTokens} çıktı:${outputTokens} ` +
      `cache_yazma:${cacheWriteTokens} cache_okuma:${cacheReadTokens} toplam_girdi:${
        inputTokens + cacheWriteTokens + cacheReadTokens
      } => $${costUsd.toFixed(4)} (bu tek istek)`
  );
  return costUsd;
}

/**
 * imageBuffer: Buffer (yüklenen fotoğraf — tek fotoğraf akışında ürünün
 *   önü/arkası her ikisi de olabilir; iki fotoğraf akışında bu ÖN yüzdür)
 * mimeType: örn. "image/jpeg"
 * imageBackBuffer / backMimeType: opsiyonel — kullanıcı içerik listesinin
 *   olduğu arka yüzü de çektiyse ikinci görsel buraya gelir. Verilirse AI'ye
 *   iki görsel birden gönderilir ve içerik listesini bu ikinci görselden
 *   okuması, ürünü ilk görselden (marka/ambalaj) teyit etmesi istenir.
 * userProvidedName: OPSİYONEL. Barkod yokken/okunamadığında AI markayı tanıyıp
 *   tam ürünü/varyantı (ör. "saç dökülmesine karşı" hattı) yanlış tahmin
 *   edebiliyor — kullanıcı ScanScreen'deki opsiyonel alana ürünün gerçek adını
 *   yazdıysa buraya gelir. Verilirse AI'ye "productName kesin budur, tahmin
 *   yürütme" diye açıkça söylüyoruz; içerik listesi yine fotoğraftan okunuyor.
 * userProvidedIngredients: OPSİYONEL. İçerik listesi fotoğraftan net
 *   okunamıyorsa (kavisli şişe, küçük/soluk yazı vb.) AI genel/tipik bir
 *   formülasyona düşüyor — gerçek ürünün gerçek listesi değil. Kullanıcı
 *   etikette yazan listeyi kendisi yazdıysa/yapıştırdıysa buraya gelir; bu
 *   durumda fotoğraftan İÇERİK okumaya çalışılmaz, bu metin DOĞRULANMIŞ veri
 *   olarak kabul edilir (OBF akışındaki ingredientsText ile aynı mantık).
 * userIntent: OPSİYONEL. Kullanıcının "bu ürünü ne için kullanmak
 *   istiyorsun?" sorusuna o taramaya özel verdiği yanıt (ör. "saç dökülmesi
 *   için"). Verilirse AI'den bu amaç için ürünün gerçekten uygun olup
 *   olmadığını açıkça değerlendirmesi istenir.
 * bothImagesAreIngredients: OPSİYONEL. true ise imageBackBuffer bir "arka
 *   yüz" değil, aynı içerik/bileşen etiketinin DEVAMI (kavisli şişe senaryosu)
 *   — bu durumda iki-görsel talimatı ön/arka ayrımı yapmadan, iki fotoğrafı
 *   tek bir liste gibi birleştirmeyi ister.
 * Döner: ProductAnalysis şekline uygun obje (id/createdAt/imageUri olmadan)
 */
async function analyzeProductImage(
  imageBuffer,
  mimeType,
  imageBackBuffer,
  backMimeType,
  profile,
  userProvidedName,
  userProvidedIngredients,
  userIntent,
  bothImagesAreIngredients
) {
  const anthropic = getClient();

  if (!anthropic) {
    console.warn("[analyze] ANTHROPIC_API_KEY tanımlı değil, mock analiz döndürülüyor.");
    return getMockAnalysis();
  }

  const base64Image = imageBuffer.toString("base64");
  const hasBackImage = Boolean(imageBackBuffer && imageBackBuffer.length > 0);

  const content = [
    {
      type: "image",
      source: { type: "base64", media_type: mimeType, data: base64Image },
    },
  ];

  if (hasBackImage) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: backMimeType || "image/jpeg", data: imageBackBuffer.toString("base64") },
    });
  }

  // Kullanıcı profili varsa (cilt tipi/hedefler/alerjiler), kullanıcı metnine
  // ekliyoruz ki model personalizedNote'u buna göre doldursun.
  const profileBlock = buildProfileBlock(profile);
  let baseUserText = hasBackImage
    ? (bothImagesAreIngredients ? USER_PROMPT_TWO_IMAGES_BOTH_INGREDIENTS : USER_PROMPT_TWO_IMAGES)
    : USER_PROMPT;
  if (userProvidedName && userProvidedName.trim()) {
    baseUserText +=
      `\n\nKULLANICI ÜRÜN ADINI KENDİSİ BELİRTTİ: Bu ürünün tam olarak "${userProvidedName.trim()}" ` +
      "olduğunu kullanıcı yazdı — bunu KESİN doğru kabul et, \"productName\" (ve belliyse \"brand\") " +
      "alanlarını buna göre yaz, ürünün ne olduğunu fotoğraftan AYRICA tahmin etmeye ÇALIŞMA.";
  }
  if (userProvidedIngredients && userProvidedIngredients.trim()) {
    // Kullanıcı gerçek içerik listesini verdiyse, fotoğraftan İÇERİK okuma
    // talimatını geçersiz kılıyoruz — bu metin fotoğraftan daha güvenilir
    // (kullanıcı etikette gerçekten yazanı kopyaladı/yazdı).
    baseUserText +=
      "\n\nKULLANICI İÇERİK LİSTESİNİ KENDİSİ YAZDI (bu, fotoğraftaki okunaksız/eksik kısımdan DAHA " +
      "GÜVENİLİR kabul edilmeli): \n" +
      userProvidedIngredients.trim() +
      "\n\"ingredients\" alanını YUKARIDAKİ metne dayanarak doldur (her bileşeni ayrı madde olarak, " +
      "normal kurallara göre) — fotoğraftaki içerik/bileşen listesini AYRICA okumaya ÇALIŞMA, bu metin " +
      "zaten doğrulanmış veri. Fotoğrafı sadece ürün kimliği/ambalaj teyidi için kullan.";
  } else if (userProvidedName && userProvidedName.trim()) {
    baseUserText +=
      " İçerik/bileşen listesini yine normal kurallara göre fotoğraftan oku (okunamıyorsa bu ürün " +
      "için bilinen tipik formülasyonu kullan).";
  }
  if (userIntent && userIntent.trim()) {
    // Kayıtlı kullanıcı profilinden (varsa) bağımsız — bu SADECE bu tarama
    // için geçerli, o anki kullanım niyeti. effectivenessSummary/
    // personalizedNote bu amaca göre dürüst bir değerlendirme yapmalı;
    // profile block'taki gibi personalizedNote'u ZORUNLU doldurmuyoruz (o
    // hâlâ kayıtlı profile bağlı), ama effectivenessSummary'de mutlaka
    // değinilmesini istiyoruz.
    baseUserText +=
      `\n\nKULLANICININ KULLANIM AMACI: Kullanıcı bu ürünü şunun için kullanmak istediğini belirtti: ` +
      `"${userIntent.trim()}". "effectivenessSummary" içinde ürünün TAM OLARAK bu amaç için ne kadar ` +
      `uygun/etkili olduğunu AÇIKÇA değerlendir — uygun değilse ya da bu amaçla ilgisizse bunu dürüstçe ` +
      `söyle, uydurma iddiada bulunma.`;
  }
  content.push({ type: "text", text: profileBlock ? baseUserText + "\n" + profileBlock : baseUserText });

  // ÖNEMLİ: max_tokens: 32000 gibi yüksek bir değerle normal (streaming
  // olmayan) messages.create() çağrısı yaparsak, Anthropic SDK'sı "bu istek
  // 10 dakikadan uzun sürebilir, streaming kullanman gerekiyor" hatasıyla
  // İSTEĞİ HİÇ GÖNDERMEDEN reddediyor (SDK'nın kendi güvenlik kontrolü).
  // Bu hata /analyze içindeki try/catch tarafından yakalanıp mock veriye
  // düşülmesine yol açıyordu — Render loglarında "Streaming is required for
  // operations that may take longer than 10 minutes" olarak görünen buydu.
  // Çözüm: SDK'nın streaming yardımcısını (.stream()) kullanmak — bu, aynı
  // sonucu (tam metni) üretiyor ama SDK'nın uzun-istek kısıtlamasına takılmıyor.
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    system: cachedSystemPrompt(SYSTEM_PROMPT),
    messages: [{ role: "user", content }],
  });
  const response = await stream.finalMessage();

  if (response.stop_reason === "max_tokens") {
    console.warn("[analyze] Model yanıtı max_tokens sınırında kesildi (görsel analiz).");
  }
  logUsageAndCost(response, "analyzeProductImage (fotoğraf analizi)");
  const parsed = extractJson(extractTextBlock(response));
  return { ...withSafeDefaults(parsed), source: "ai" };
}

/**
 * Open Beauty Facts'ten doğrulanmış ürün bilgisiyle (çoğunlukla fotoğrafsız,
 * sadece metin) analiz yapar. Fotoğraf göndermediğimiz için görsel token
 * maliyeti olmuyor, ayrıca ürün adı/marka/içerik listesi doğrulanmış olduğu
 * için daha güvenilir.
 *
 * productInfo: { productName, brand, ingredientsText }
 * imageBuffer/mimeType: OPSİYONEL. Open Beauty Facts'te ürün ADI eksikse
 *   (marka biliniyor ama tam ürün/varyant bilinmiyorsa — örn. "Vichy" markası
 *   tanınıp "saç dökülme karşıtı" olduğu anlaşılamıyorsa) index.js bu
 *   fonksiyona kullanıcının zaten çekmiş olduğu fotoğrafı da gönderir; model
 *   SADECE ürünün tam adını/varyantını görselden okumak için bunu kullanır,
 *   içerik listesi yine metinden gelir. Ürün adı zaten doluysa bu parametreler
 *   verilmez — gereksiz görsel maliyeti olmasın diye.
 */
async function analyzeKnownProduct(productInfo, profile, imageBuffer, mimeType) {
  const anthropic = getClient();

  if (!anthropic) {
    console.warn("[analyze] ANTHROPIC_API_KEY tanımlı değil, mock analiz döndürülüyor.");
    const mock = getMockAnalysis();
    return {
      ...mock,
      productName: productInfo.productName || mock.productName,
      brand: productInfo.brand || mock.brand,
    };
  }

  const hasImage = Boolean(imageBuffer && imageBuffer.length);
  if (hasImage) {
    console.log("[analyze] OBF ürün adı eksik — ürün kimliğini netleştirmek için fotoğraf da AI'ye gönderiliyor (ekstra görsel maliyeti var).");
  }

  const profileBlock = buildProfileBlock(profile);
  const userText = buildKnownProductUserPrompt(productInfo, hasImage) + (profileBlock ? "\n" + profileBlock : "");

  const content = hasImage
    ? [
        { type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: imageBuffer.toString("base64") } },
        { type: "text", text: userText },
      ]
    : userText;

  // (Yukarıdaki analyzeProductImage'daki aynı not geçerli — yüksek max_tokens
  // ile streaming olmadan istek atarsak SDK "Streaming is required..." hatası
  // veriyor. Bunu Render loglarında tam olarak bu fonksiyon için gördük.)
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    system: cachedSystemPrompt(KNOWN_PRODUCT_SYSTEM_PROMPT),
    messages: [{ role: "user", content }],
  });
  const response = await stream.finalMessage();

  if (response.stop_reason === "max_tokens") {
    console.warn("[analyze] Model yanıtı max_tokens sınırında kesildi (barkod tabanlı analiz).");
  }
  logUsageAndCost(response, "analyzeKnownProduct (barkod/bilinen ürün analizi)");
  const parsed = extractJson(extractTextBlock(response));
  return { ...withSafeDefaults(parsed), source: "ai+barcode" };
}

module.exports = { analyzeProductImage, analyzeKnownProduct };