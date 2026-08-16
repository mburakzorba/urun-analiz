// Anthropic API isteği başarısız olursa ya da ANTHROPIC_API_KEY tanımlı değilse
// backend'in kesintisiz cevap verebilmesi için kullanılan yedek (fallback) veri.
// Not: Bu dosya, mobil uygulamadaki src/services/mockAnalysis.ts ile aynı örneği kullanır.

function getMockAnalysis() {
  return {
    productName: "Saç Dökülme Karşıtı Şampuan (örnek analiz)",
    brand: "Bilinmiyor",
    category: "Saç Bakımı",
    effectivenessScore: 62,
    effectivenessSummary:
      "İçerikte bulunan Kafein ve Biotin, klinik çalışmalarda saç köklerini güçlendirmeye yardımcı olduğu gösterilen bileşenler. Ancak etkinin gözlenmesi genelde 8-12 haftalık düzenli kullanım gerektiriyor ve sonuçlar kişiden kişiye değişiyor.",
    healthScore: 71,
    ingredients: [
      { name: "Aqua (Su)", risk: "iyi", explanation: "Taşıyıcı bileşen, herhangi bir risk taşımaz." },
      { name: "Sodium Laureth Sulfate", risk: "orta", explanation: "Etkili bir temizleyici fakat hassas ciltte tahrişe yol açabilir." },
      { name: "Caffeine", risk: "iyi", explanation: "Saç köklerini uyararak dökülmeyi yavaşlattığı gösterilmiş bir bileşen." },
      { name: "Biotin (Vitamin B7)", risk: "iyi", explanation: "Saç ve tırnak sağlığını destekleyen bilinen bir vitamin." },
      { name: "Parfum (Fragrance)", risk: "orta", explanation: "Kokulandırıcı; alerjik hassasiyeti olanlarda tahriş yapabilir." },
      { name: "Sodium Chloride", risk: "iyi", explanation: "Kıvam arttırıcı, düşük risk." },
      { name: "Methylisothiazolinone", risk: "riskli", explanation: "Koruyucu madde; bazı kullanıcılarda temas dermatitine neden olabildiği raporlanmıştır." },
    ],
    harmfulIngredients: [
      { name: "Methylisothiazolinone", risk: "riskli", explanation: "Koruyucu madde; hassas ciltte alerjik reaksiyona yol açabilir. AB'de leave-on ürünlerde kısıtlanmıştır." },
      { name: "Sodium Laureth Sulfate", risk: "orta", explanation: "Yoğun kullanımda saç derisini kurutabilir." },
    ],
    beneficialIngredients: [
      { name: "Caffeine", risk: "iyi", explanation: "Saç köklerinde kan dolaşımını desteklediği düşünülüyor." },
      { name: "Biotin (Vitamin B7)", risk: "iyi", explanation: "Saç yapısını güçlendirmeye yardımcı olabilir." },
    ],
    reviewSummary: {
      averageSentiment: 68,
      totalMentionsAnalyzed: 1240,
      positiveHighlights: [
        "Kullanıcıların çoğu 2 ay sonra dökülmede belirgin azalma bildiriyor",
        "Saç derisini yormadığı, hafif bir koku bıraktığı belirtiliyor",
      ],
      negativeHighlights: [
        "Bazı kullanıcılar ilk haftalarda hafif kaşıntı yaşadığını belirtiyor",
        "Uzun saçlarda saç derisine ek olarak uçlara da uygulamanın kuruluğa yol açtığı söyleniyor",
      ],
      sampleQuotes: [
        { text: "3 ay düzenli kullandım, tarakta kalan saç sayısı gözle görülür azaldı.", sentiment: "olumlu" },
        { text: "Kokusu güzel ama ilk hafta saç derim biraz kaşındı.", sentiment: "olumsuz" },
        { text: "Fiyatına göre performansı fena değil, ama mucize beklemeyin.", sentiment: "nötr" },
      ],
    },
    disclaimer:
      "Bu analiz yapay zeka tarafından ürün etiketi ve genel kullanıcı geri bildirimlerinden yola çıkarak oluşturulmuştur; tıbbi tavsiye yerine geçmez. Cilt/saç sorunlarınız için bir uzmana danışın.",
    source: "mock",
  };
}

module.exports = { getMockAnalysis };
