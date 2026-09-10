// 9 Eylül eklemesi (kullanıcı isteği — "sorun bildir butonuna bassın yeter
// kullanıcıyı uğraştırmayalım, butona bastığı anda bana direkt mail gelsin
// otomatik atsın"): eskiden bu ekran sadece kullanıcının kendi mail
// uygulamasını (mailto:) açıyordu — kullanıcının "Gönder"e AYRICA basması
// gerekiyordu. Artık backend'deki YENİ /report-problem endpoint'ine
// (bkz. server/src/reportProblem.js) doğrudan POST atıyoruz; backend de
// Resend (e-posta API'si) üzerinden GERÇEKTEN otomatik bir mail gönderiyor —
// kullanıcının hiçbir ek adım atmasına gerek yok.
//
// EXPO_PUBLIC_API_URL tanımlı değilse (backend hiç bağlanmamışsa) ya da bu
// istek başarısız olursa, çağıran taraf (ReportProblemScreen) eski mailto:
// yöntemine DÜŞEBİLİR — bkz. o dosyadaki try/catch. Burada sessizce mock bir
// "başarılı" dönmüyoruz, gerçek hatayı fırlatıyoruz ki çağıran doğru kararı
// (mailto'ya düş / kullanıcıya hata göster) verebilsin.
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const APP_SECRET = process.env.EXPO_PUBLIC_APP_SECRET;

export interface ReportProblemParams {
  issueTitle: string;
  issueDesc: string;
  description: string;
  productHint?: string;
  productName?: string;
  productBrand?: string;
  analysisDateText?: string;
  photoUri?: string | null;
}

// API_URL tanımlı değilse (demo/backend'siz kurulum) bu fonksiyon hiç
// çağrılmamalı — ReportProblemScreen bu durumu ayrıca kontrol ediyor.
export function isReportBackendConfigured(): boolean {
  return !!API_URL;
}

export async function sendProblemReport(params: ReportProblemParams): Promise<void> {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL tanımlı değil — sorun bildirimi backend'i bağlı değil.");
  }

  const formData = new FormData();
  formData.append("issueTitle", params.issueTitle);
  formData.append("issueDesc", params.issueDesc);
  formData.append("description", params.description || "");
  if (params.productHint) formData.append("productHint", params.productHint);
  if (params.productName) formData.append("productName", params.productName);
  if (params.productBrand) formData.append("productBrand", params.productBrand);
  if (params.analysisDateText) formData.append("analysisDateText", params.analysisDateText);
  if (params.photoUri) {
    // ScanScreen/analyzeProduct.ts'teki AYNI desen — RN'de fetch'e dosya
    // eklemenin standart yolu.
    formData.append("photo", {
      uri: params.photoUri,
      name: "etiket.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/report-problem`, {
      method: "POST",
      body: formData,
      headers: APP_SECRET ? { "X-App-Secret": APP_SECRET } : undefined,
    });
  } catch (networkError: any) {
    throw new Error(`Sunucuya bağlanılamadı (ağ hatası): ${networkError?.message || String(networkError)}`);
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(`Sunucu hatası ${response.status}: ${bodyText || "(gövde boş)"}`.trim());
  }
}
