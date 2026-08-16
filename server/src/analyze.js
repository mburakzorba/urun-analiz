const Anthropic = require("@anthropic-ai/sdk");
const { SYSTEM_PROMPT, USER_PROMPT, KNOWN_PRODUCT_SYSTEM_PROMPT, buildKnownProductUserPrompt } = require("./prompt");
const { getMockAnalysis } = require("./mockAnalysis");

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
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
    if (match) return JSON.parse(match[0]);
    throw new Error("Model yanıtından JSON çıkarılamadı");
  }
}

function extractTextBlock(response) {
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) throw new Error("Modelden metin yanıtı alınamadı");
  return textBlock.text;
}

/**
 * imageBuffer: Buffer (yüklenen fotoğraf)
 * mimeType: örn. "image/jpeg"
 * Döner: ProductAnalysis şekline uygun obje (id/createdAt/imageUri olmadan)
 */
async function analyzeProductImage(imageBuffer, mimeType) {
  const anthropic = getClient();

  if (!anthropic) {
    console.warn("[analyze] ANTHROPIC_API_KEY tanımlı değil, mock analiz döndürülüyor.");
    return getMockAnalysis();
  }

  const base64Image = imageBuffer.toString("base64");

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType, data: base64Image },
          },
          { type: "text", text: USER_PROMPT },
        ],
      },
    ],
  });

  const parsed = extractJson(extractTextBlock(response));
  return { ...parsed, source: "ai" };
}

/**
 * Open Beauty Facts'ten doğrulanmış ürün bilgisiyle (fotoğrafsız, sadece metin)
 * analiz yapar. Fotoğraf göndermediğimiz için görsel token maliyeti olmuyor,
 * ayrıca ürün adı/marka/içerik listesi doğrulanmış olduğu için daha güvenilir.
 *
 * productInfo: { productName, brand, ingredientsText }
 */
async function analyzeKnownProduct(productInfo) {
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

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: KNOWN_PRODUCT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildKnownProductUserPrompt(productInfo) }],
  });

  const parsed = extractJson(extractTextBlock(response));
  return { ...parsed, source: "ai+barcode" };
}

module.exports = { analyzeProductImage, analyzeKnownProduct };
