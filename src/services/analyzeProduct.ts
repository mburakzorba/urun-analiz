import { ProductAnalysis } from "../types";
import { getMockAnalysis } from "./mockAnalysis";

// Backend adresini .env dosyasından okuyoruz (bkz. .env.example).
// Expo'da client tarafına açılan env değişkenleri EXPO_PUBLIC_ ile başlamalı.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * Kullanıcının çektiği ürün fotoğrafını (ve varsa algılanan barkodu) analiz eder.
 * - EXPO_PUBLIC_API_URL tanımlıysa backend'e (Claude API destekli) multipart
 *   upload ile istek atar. Barkod varsa backend önce paylaşımlı önbelleğe,
 *   sonra Open Beauty Facts'e bakar; ikisi de sonuç vermezse fotoğraf+AI'ye düşer.
 * - Backend tanımlı değilse veya istek başarısız olursa, uygulamanın demo/test
 *   sırasında kesintisiz çalışması için gerçekçi bir mock analiz döner.
 */
export async function analyzeProductPhoto(
  imageUri: string,
  barcode?: string,
  backImageUri?: string
): Promise<ProductAnalysis> {
  if (!API_URL) {
    console.warn(
      "[analyzeProduct] EXPO_PUBLIC_API_URL tanımlı değil, mock analiz kullanılıyor. Gerçek AI analizi için backend/README.md dosyasına bakın."
    );
    return simulateDelay(() => getMockAnalysis(imageUri, barcode));
  }

  // ÖNEMLİ: Backend adresi (API_URL) tanımlıysa artık burada hata olursa
  // SESSİZCE mock veriye düşmüyoruz — hatayı olduğu gibi yukarı (Analyzing
  // ekranına) fırlatıyoruz. Önceden burası hatayı yutup mock döndürdüğü için
  // gerçek bir sunucu/ağ hatası ile "demo verisi" ekranı birbirinden ayırt
  // edilemiyordu; kullanıcı hep aynı sahte "Şampuan" sonucunu görüp bunun bir
  // hata mı yoksa normal bir davranış mı olduğunu anlayamıyordu. Artık
  // Analyzing ekranı gerçek hata mesajını gösterecek, böylece asıl sorunu
  // (400/500 kodu, "Network request failed" vb.) doğrudan ekrandan okuyup
  // teşhis edebileceğiz. Mock veri SADECE API_URL hiç tanımlı değilse
  // (yukarıdaki erken dönüş) kullanılıyor.
  const formData = new FormData();
  // React Native'de fetch'e dosya eklemenin standart yolu bu obje şeklidir.
  formData.append("image", {
    uri: imageUri,
    name: "product.jpg",
    type: "image/jpeg",
  } as unknown as Blob);
  if (backImageUri) {
    // Kullanıcı ön yüzden sonra içerik listesinin olduğu arka yüzü de
    // çektiyse, AI'nin tahmin yürütmek yerine gerçek listeden okuyabilmesi
    // için ikinci görseli de gönderiyoruz.
    formData.append("imageBack", {
      uri: backImageUri,
      name: "product-back.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
  }
  if (barcode) {
    formData.append("barcode", barcode);
  }

  // ÖNEMLİ: Content-Type header'ını BURADA elle set ETMİYORUZ. FormData
  // gönderirken fetch/React Native, multipart body'nin gerektirdiği
  // "boundary" değerini otomatik ekleyerek doğru Content-Type'ı kendisi
  // oluşturur (örn. "multipart/form-data; boundary=----abc123"). Elle
  // "multipart/form-data" yazarsak boundary eksik kalır, sunucu (multer)
  // isteği parse edemez ve istek başarısız olur.
  let response: Response;
  try {
    response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch (networkError: any) {
    // fetch'in kendisi başarısız oldu (telefon internete çıkamadı, Render
    // servisi ayakta değil, DNS hatası vb.) — istek sunucuya hiç ulaşmadı.
    throw new Error(
      `Sunucuya bağlanılamadı (ağ hatası): ${networkError?.message || String(networkError)}`
    );
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    // Sunucu istekten haberdar oldu ama bir hata döndürdü (400/500 vb.) —
    // gövdeyi de mesaja ekliyoruz ki ekranda tam sebep okunabilsin.
    throw new Error(`Sunucu hatası ${response.status}: ${bodyText || "(gövde boş)"}`.trim());
  }

  const data = (await response.json()) as ProductAnalysis;
  return { ...data, imageUri };
}

function simulateDelay<T>(fn: () => T, ms = 1800): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(fn()), ms));
}