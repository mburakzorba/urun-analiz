import React, { useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Scan">;

// Ürünlerde tipik olarak bulunan perakende barkod formatları (QR hariç —
// burada QR kod değil, ürün barkodu arıyoruz).
const PRODUCT_BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e"] as const;

export default function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const barcodeLockRef = useRef(false);

  const goToAnalyzing = (imageUri: string, barcode?: string) => {
    navigation.replace("Analyzing", { imageUri, barcode });
  };

  const takePhoto = async (barcode?: string) => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) goToAnalyzing(photo.uri, barcode);
    } catch (e) {
      Alert.alert("Hata", "Fotoğraf çekilemedi, tekrar dener misin?");
    } finally {
      setIsCapturing(false);
    }
  };

  // Barkod algılandığında: kısa bir onay gösterip otomatik fotoğraf çekip
  // devam ediyoruz. barcodeLockRef, kamera görüş alanında barkod dururken
  // onBarcodeScanned'in saniyede defalarca tetiklenmesini engelliyor.
  const handleBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (barcodeLockRef.current || isCapturing) return;
    barcodeLockRef.current = true;
    setDetectedBarcode(result.data);
    setTimeout(() => {
      takePhoto(result.data);
    }, 500);
  }, [isCapturing]);

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      // Galeriden seçilen fotoğrafta barkod algılamıyoruz, direkt AI analizine düşer.
      goToAnalyzing(result.assets[0].uri);
    }
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
        barcodeScannerSettings={{ barcodeTypes: [...PRODUCT_BARCODE_TYPES] }}
        onBarcodeScanned={detectedBarcode ? undefined : handleBarcodeScanned}
      />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          {detectedBarcode ? (
            <View style={styles.barcodeBanner}>
              <Text style={styles.barcodeBannerText}>✓ Barkod algılandı — otomatik taranıyor...</Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              Ürünün barkodunu göster (otomatik algılanır) ya da içerik listesini çerçeve içine alıp
              fotoğraf çek
            </Text>
          )}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={pickFromGallery} style={styles.galleryBtn}>
            <Text style={styles.galleryBtnText}>Galeri</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => takePhoto()} style={styles.shutterBtn} disabled={isCapturing}>
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
  topBar: { padding: spacing.lg },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  closeBtnText: { color: "#fff", fontSize: 16 },
  hint: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.4)",
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
