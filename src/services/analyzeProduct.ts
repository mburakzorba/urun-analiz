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
export async function analyzeProductPhoto(imageUri: string, barcode?: string): Promise<ProductAnalysis> {
  if (!API_URL) {
    console.warn(
      "[analyzeProduct] EXPO_PUBLIC_API_URL tanımlı değil, mock analiz kullanılıyor. Gerçek AI analizi için backend/README.md dosyasına bakın."
    );
    return simulateDelay(() => getMockAnalysis(imageUri, barcode));
  }

  try {
    const formData = new FormData();
    // React Native'de fetch'e dosya eklemenin standart yolu bu obje şeklidir.
    formData.append("image", {
      uri: imageUri,
      name: "product.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
    if (barcode) {
      formData.append("barcode", barcode);
    }

    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend hata döndürdü: ${response.status}`);
    }

    const data = (await response.json()) as ProductAnalysis;
    return { ...data, imageUri };
  } catch (error) {
    console.warn("[analyzeProduct] Backend isteği başarısız, mock analiz kullanılıyor:", error);
    return getMockAnalysis(imageUri, barcode);
  }
}

function simulateDelay<T>(fn: () => T, ms = 1800): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(fn()), ms));
}
