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

// Deploy'un gerçekten geçtiğini anlamak için sürüm etiketi. Kodda bir
// değişiklik yapıp Render'a gönderdikten sonra tarayıcıda /health adresine
// bakınca burada yazan değeri görüyorsan yeni kod canlıdır. Görmüyorsan
// deploy tamamlanmamıştır (ya da hâlâ sürüyordur).
const APP_VERSION = "2026-08-18-kisisel-profil-kullanim-sikligi";

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
  res.json({ ok: true, hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY), version: APP_VERSION });
});

app.post("/analyze", uploadFields, async (req, res) => {
  try {
    const barcode = (req.body && req.body.barcode ? String(req.body.barcode) : "").trim();

    // Kullanıcı profili (cilt tipi/hedefler/alerjiler) — client'tan JSON
    // string olarak gelir, sadece kullanıcı Profilim ekranını doldurduysa
    // gönderilir. Bozuksa/parse edilemezse sessizce yok sayıyoruz — profil
    // olmadan da normal (kişiselleştirilmemiş) analiz çalışmaya devam eder.
    let profile;
    if (req.body && req.body.profile) {
      try {
        profile = JSON.parse(req.body.profile);
      } catch (err) {
        console.warn("[/analyze] profile alanı parse edilemedi, yok sayılıyor:", err.message);
      }
    }

    // 1) Barkod varsa: önce paylaşımlı önbelleğe bak. Daha önce biri bu ürünü
    //    taradıysa, AI'ye hiç sormadan aynı sonucu anında döneriz.
    //    ÖNEMLİ: personalizedNote kişiye özel (kullanıcının alerjilerini vb.
    //    içerebilir) — önbellek TÜM kullanıcılar arasında paylaşıldığı için
    //    cache'ten dönen sonuçta personalizedNote'u boşaltıyoruz, yoksa bir
    //    kullanıcının profil bilgisi başka bir kullanıcıya sızmış olur.
    if (barcode) {
      const cached = getCachedProduct(barcode);
      if (cached) {
        console.log(`[/analyze] Önbellek isabeti: ${barcode}`);
        return res.json({
          id: randomUUID(),
          createdAt: new Date().toISOString(),
          ...cached,
          personalizedNote: "",
          source: "cache",
        });
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
          result = await analyzeKnownProduct(known, profile);
        } catch (err) {
          console.error("[/analyze] Barkod tabanlı AI analizi başarısız, mock veri dönülüyor:", err.message);
          result = { ...getMockAnalysis(), source: "ai+barcode" };
        }
        // Önbelleğe personalizedNote OLMADAN yazıyoruz (yukarıdaki not) —
        // ama bu isteği yapan kullanıcıya kendi kişiselleştirilmiş sonucunu
        // (varsa) yine de dönüyoruz.
        saveCachedProduct(barcode, { ...result, personalizedNote: "" });
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
        imageBackFile?.mimetype || "image/jpeg",
        profile
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

// Genel hata yakalayıcı — özellikle multer hataları (örn. istemci ile sunucu
// farklı sürümlerdeyse "Unexpected field" gibi hatalar) varsayılan olarak
// Express'in HTML hata sayfasını döner; bu da istemci tarafında okunaksız,
// teşhisi zor bir metin olarak görünür. Burada JSON'a çeviriyoruz ki hata
// mesajı uygulama ekranında (Analiz başarısız oldu) net okunabilsin.
app.use((err, _req, res, _next) => {
  console.error("[index] Yakalanmayan hata:", err);
  if (err && err.name === "MulterError") {
    return res.status(400).json({
      error: `Dosya yükleme hatası (${err.code}): ${err.message}. Bu genelde istemci ile sunucu farklı sürümde olduğunda olur — sunucunun (Render) en güncel index.js ile deploy edildiğinden emin ol.`,
    });
  }
  res.status(500).json({ error: err?.message || "Sunucu hatası" });
});

app.listen(PORT, () => {
  console.log(`Ürün Analiz backend ${PORT} portunda çalışıyor. Sürüm: ${APP_VERSION}`);
  console.log(
    process.env.ANTHROPIC_API_KEY
      ? "AI modu aktif (ANTHROPIC_API_KEY tanımlı)."
      : "UYARI: ANTHROPIC_API_KEY tanımlı değil, tüm istekler mock veri döndürecek."
  );
});