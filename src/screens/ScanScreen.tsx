import React, { useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, BarcodeScanningResult, BarcodeType } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Scan">;

// Ürünlerde karşılaşılabilecek barkod formatları. Perakende ürünlerde asıl
// kullanılanlar EAN/UPC ailesi, ama bazı kozmetik kutularında code128 / itf14
// da basılı olabiliyor — algılama şansını artırmak için hepsini dinliyoruz.
const PRODUCT_BARCODE_TYPES: BarcodeType[] = [
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "code39",
  "itf14",
];

// iOS'ta ana (1x) kamera bu isimle geliyor. Bazı iPhone'larda kamera
// varsayılan olarak ultra-geniş (0.5x) lensi seçebiliyor; o lens yakın
// çekimde belirgin şekilde daha bulanık/bozuk görüntü veriyor ve hem barkod
// okuma hem etiket okuma başarısını düşürüyor.
const MAIN_LENS = "builtInWideAngleCamera";

// idle: normal tarama modu (barkod dinliyor, ilk/tek fotoğrafı bekliyor)
// awaitingBackChoice: ön yüz çekildi, kullanıcıya arka yüzü (içerik listesi)
//   de çekmek isteyip istemediği soruluyor
// capturingBack: kullanıcı "arka yüzü çek" dedi, bir sonraki deklanşör
//   basışı arka yüz/içerik listesi fotoğrafı olarak kaydedilecek
type Stage = "idle" | "awaitingBackChoice" | "capturingBack";

export default function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [selectedLens, setSelectedLens] = useState<string | undefined>(undefined);
  const barcodeLockRef = useRef(false);

  // Kamera hazır olunca cihazdaki lensleri sorup ana (1x geniş açı) lensi
  // açıkça seçiyoruz. iOS dışında bu API yok, o yüzden hata durumunu sessizce
  // yutuyoruz (varsayılan lens kullanılmaya devam eder).
  const handleCameraReady = useCallback(async () => {
    try {
      const lenses = await cameraRef.current?.getAvailableLensesAsync();
      if (!lenses?.length) return;
      const main =
        lenses.find((l) => l === MAIN_LENS) ??
        lenses.find((l) => /wideangle/i.test(l) && !/ultra/i.test(l));
      if (main) setSelectedLens(main);
    } catch {
      // iOS dışı platform ya da desteklenmeyen cihaz — varsayılanla devam.
    }
  }, []);

  const goToAnalyzing = (imageUri: string, backImageUri?: string, barcode?: string) => {
    navigation.replace("Analyzing", { imageUri, backImageUri, barcode });
  };

  const takePhoto = async (opts?: { barcode?: string; isBackShot?: boolean }) => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      // quality 1: içerik listesi gibi küçük yazıların AI tarafından
      // okunabilmesi için JPEG sıkıştırmasını en aza indiriyoruz.
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo?.uri) return;

      if (opts?.barcode) {
        // Barkod otomatik algılandığında tek fotoğraf yeterli — barkod zaten
        // ürünü güçlü şekilde tanımlıyor, iki adımlı akışa gerek yok.
        goToAnalyzing(photo.uri, undefined, opts.barcode);
        return;
      }

      if (opts?.isBackShot) {
        // İki adımlı akışın 2. fotoğrafı: içerik listesinin olduğu arka yüz.
        goToAnalyzing(frontUri as string, photo.uri);
        return;
      }

      // İlk fotoğraf (genelde ön yüz). Hemen analiz etmek yerine kullanıcıya
      // arka yüzü/içerik listesini de çekmesini öneriyoruz: AI'nin ön yüzden
      // tahmin yürütmesindense gerçek içerik listesinden okuması çok daha
      // doğru sonuç veriyor.
      setFrontUri(photo.uri);
      setStage("awaitingBackChoice");
    } catch (e) {
      Alert.alert("Hata", "Fotoğraf çekilemedi, tekrar dener misin?");
    } finally {
      setIsCapturing(false);
    }
  };

  // Barkod algılandığında: kısa bir onay gösterip otomatik fotoğraf çekip
  // devam ediyoruz. barcodeLockRef, kamera görüş alanında barkod dururken
  // onBarcodeScanned'in saniyede defalarca tetiklenmesini engelliyor.
  // Gecikme (950ms), barkod algılandığı anda kameranın henüz netlenmemiş
  // olabileceği için bilinçli olarak konuldu.
  const handleBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (barcodeLockRef.current || isCapturing) return;
    barcodeLockRef.current = true;
    setDetectedBarcode(result.data);
    setTimeout(() => {
      takePhoto({ barcode: result.data });
    }, 950);
  }, [isCapturing]);

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      // Galeriden seçilen fotoğrafta barkod algılamıyoruz, direkt AI analizine düşer.
      goToAnalyzing(result.assets[0].uri);
    }
  };

  const skipBackShot = () => {
    if (!frontUri) return;
    goToAnalyzing(frontUri);
  };

  const startBackShot = () => {
    setStage("capturingBack");
  };

  if (!permission) {
    return <View style={styles.safe} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionText}>
            Ürün etiketini taramak için kamera iznine ihtiyacımız var.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>İzin Ver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryLinkBtn} onPress={pickFromGallery}>
            <Text style={styles.galleryLinkText}>veya galeriden fotoğraf seç</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        autofocus="on"
        enableTorch={torchOn}
        onCameraReady={handleCameraReady}
        // Ana (1x) kamera lensini açıkça seçiyoruz — bkz. MAIN_LENS notu.
        selectedLens={selectedLens}
        zoom={0}
        barcodeScannerSettings={{ barcodeTypes: PRODUCT_BARCODE_TYPES }}
        onBarcodeScanned={stage === "idle" && !detectedBarcode ? handleBarcodeScanned : undefined}
      />

      {/* Çerçeveleme kılavuzu: kullanıcının etiketi/barkodu kadraja tam
          doldurması, AI'nin küçük yazıları okuyabilmesi için en kritik nokta. */}
      <View style={styles.guideWrap} pointerEvents="none">
        <View style={styles.guideFrame} />
      </View>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTorchOn((t) => !t)}
              style={[styles.closeBtn, torchOn && styles.torchBtnActive]}
            >
              <Text style={styles.closeBtnText}>{torchOn ? "🔦" : "💡"}</Text>
            </TouchableOpacity>
          </View>
          {detectedBarcode ? (
            <View style={styles.barcodeBanner}>
              <Text style={styles.barcodeBannerText}>✓ Barkod algılandı — telefonu sabit tutun, taranıyor...</Text>
            </View>
          ) : stage === "capturingBack" ? (
            <View style={styles.barcodeBanner}>
              <Text style={styles.barcodeBannerText}>
                Şimdi İÇERİK LİSTESİNİ çerçeveye TAM doldur (yazılar ekranda okunabilsin) ve çek
              </Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              Önce ürünün BARKODUNU çerçeveye tut — okunursa ürün kesin olarak tanınır. Barkod yoksa
              ön yüzün fotoğrafını çek, ardından içerik listesini de çekmen istenecek. Yazılar ekranda
              net okunuyorsa AI de okuyabilir; okunmuyorsa biraz yaklaş, ışık azsa 💡 feneri aç.
            </Text>
          )}
        </View>

        {stage === "awaitingBackChoice" && frontUri && (
          <View style={styles.backChoiceBox} pointerEvents="auto">
            <View style={styles.backChoiceRow}>
              <Image source={{ uri: frontUri }} style={styles.backChoiceThumb} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.backChoiceTitle}>✓ Bu fotoğraf kaydedildi</Text>
                <Text style={styles.backChoiceText}>
                  Daha doğru bir analiz için İÇERİK LİSTESİNİN olduğu arka yüzü de çekmeni öneririz —
                  AI tahmin yürütmek yerine gerçek listeyi okur.
                </Text>
              </View>
            </View>
            <View style={styles.backChoiceBtnRow}>
              <TouchableOpacity style={styles.backChoiceSkipBtn} onPress={skipBackShot}>
                <Text style={styles.backChoiceSkipText}>Bu kadarı yeterli</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backChoicePrimaryBtn} onPress={startBackShot}>
                <Text style={styles.backChoicePrimaryText}>Arka Yüzü de Çek</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={pickFromGallery} style={styles.galleryBtn}>
            <Text style={styles.galleryBtnText}>Galeri</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => takePhoto(stage === "capturingBack" ? { isBackShot: true } : undefined)}
            style={styles.shutterBtn}
            disabled={isCapturing || stage === "awaitingBackChoice"}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          <View style={{ width: 64 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  overlay: { flex: 1, justifyContent: "space-between" },
  guideWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  guideFrame: {
    width: "82%",
    height: "42%",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: radius.md,
  },
  topBar: { padding: spacing.lg },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  torchBtnActive: { backgroundColor: colors.primary },
  closeBtnText: { color: "#fff", fontSize: 16 },
  hint: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: spacing.sm,
    borderRadius: radius.sm,
    fontSize: 13,
  },
  barcodeBanner: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  barcodeBannerText: { color: "#0F1115", fontSize: 13, fontWeight: "700" },
  backChoiceBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: "rgba(15,17,21,0.95)",
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backChoiceRow: { flexDirection: "row", alignItems: "flex-start" },
  backChoiceThumb: { width: 56, height: 56, borderRadius: radius.sm },
  backChoiceTitle: { color: colors.text, fontSize: 13, fontWeight: "700" },
  backChoiceText: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  backChoiceBtnRow: { flexDirection: "row", marginTop: spacing.sm, gap: spacing.sm },
  backChoiceSkipBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  backChoiceSkipText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  backChoicePrimaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  backChoicePrimaryText: { color: "#0F1115", fontSize: 13, fontWeight: "700" },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  galleryBtn: { width: 64, alignItems: "flex-start" },
  galleryBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff" },
  permissionBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  permissionText: { color: colors.text, textAlign: "center", fontSize: 15, marginBottom: spacing.lg },
  permissionBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: radius.pill },
  permissionBtnText: { color: "#0F1115", fontWeight: "700" },
  galleryLinkBtn: { marginTop: spacing.lg },
  galleryLinkText: { color: colors.accent, fontSize: 14 },
});