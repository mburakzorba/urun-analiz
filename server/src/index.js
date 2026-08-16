require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { randomUUID } = require("crypto");

const { analyzeProductImage, analyzeKnownProduct } = require("./analyze");
const { getMockAnalysis } = require("./mockAnalysis");
const { lookupBarcode } = require("./openBeautyFacts");
const { getCachedProduct, saveCachedProduct } = require("./productCache");

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB (görsel başına)
});
// "image" (ön yüz/tek fotoğraf) zorunlu, "imageBack" (içerik listesi/arka
// yüz) opsiyonel — kullanıcı ScanScreen'de "Arka Yüzü de Çek" derse gelir.
const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "imageBack", maxCount: 1 },
]);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.post("/analyze", uploadFields, async (req, res) => {
  try {
    const barcode = (req.body && req.body.barcode ? String(req.body.barcode) : "").trim();

    // 1) Barkod varsa: önce paylaşımlı önbelleğe bak. Daha önce biri bu ürünü
    //    taradıysa, AI'ye hiç sormadan aynı sonucu anında döneriz.
    if (barcode) {
      const cached = getCachedProduct(barcode);
      if (cached) {
        console.log(`[/analyze] Önbellek isabeti: ${barcode}`);
        return res.json({ id: randomUUID(), createdAt: new Date().toISOString(), ...cached, source: "cache" });
      }
    }

    // 2) Barkod varsa ve önbellekte yoksa: Open Beauty Facts'te ara. Bulunursa
    //    fotoğrafı hiç göndermeden, doğrulanmış veriyle daha ucuz/güvenilir
    //    bir analiz yapıp sonucu önbelleğe yazarız.
    if (barcode) {
      const known = await lookupBarcode(barcode);
      if (known && (known.productName || known.ingredientsText)) {
        let result;
        try {
          result = await analyzeKnownProduct(known);
        } catch (err) {
          console.error("[/analyze] Barkod tabanlı AI analizi başarısız, mock veri dönülüyor:", err.message);
          result = { ...getMockAnalysis(), source: "ai+barcode" };
        }
        saveCachedProduct(barcode, result);
        return res.json({ id: randomUUID(), createdAt: new Date().toISOString(), ...result, barcode });
      }
      console.log(`[/analyze] Barkod Open Beauty Facts'te bulunamadı, fotoğraf+AI akışına düşülüyor: ${barcode}`);
    }

    // 3) Barkod yok, ya da barkod bulunamadı: mevcut fotoğraf+AI akışı.
    const imageFile = req.files?.image?.[0];
    const imageBackFile = req.files?.imageBack?.[0];
    if (!imageFile) {
      return res.status(400).json({ error: "Fotoğraf bulunamadı ('image' alanı gerekli)" });
    }

    const mimeType = imageFile.mimetype || "image/jpeg";
    let result;
    try {
      result = await analyzeProductImage(
        imageFile.buffer,
        mimeType,
        imageBackFile?.buffer,
        imageBackFile?.mimetype || "image/jpeg"
      );
    } catch (err) {
      console.error("[/analyze] AI analizi başarısız, mock veri dönülüyor:", err.message);
      result = getMockAnalysis();
    }

    res.json({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...result,
      ...(barcode ? { barcode } : {}),
    });
  } catch (err) {
    console.error("[/analyze] Beklenmeyen hata:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

app.listen(PORT, () => {
  console.log(`Ürün Analiz backend ${PORT} portunda çalışıyor.`);
  console.log(
    process.env.ANTHROPIC_API_KEY
      ? "AI modu aktif (ANTHROPIC_API_KEY tanımlı)."
      : "UYARI: ANTHROPIC_API_KEY tanımlı değil, tüm istekler mock veri döndürecek."
  );
});