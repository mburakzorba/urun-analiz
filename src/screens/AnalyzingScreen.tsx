import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, Animated, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius } from "../theme";
import { analyzeProductPhoto } from "../services/analyzeProduct";
import { useHistory } from "../context/HistoryContext";
import { useSubscription } from "../context/SubscriptionContext";

type Props = NativeStackScreenProps<RootStackParamList, "Analyzing">;

const STEPS_WITH_BARCODE = [
  "Barkod ile ürün veritabanında aranıyor...",
  "Ürün bilgisi doğrulanıyor...",
  "İçerik/bileşenler değerlendiriliyor...",
  "Zararlı/faydalı bileşenler değerlendiriliyor...",
  "Kullanıcı yorumları özetleniyor...",
];

const STEPS_PHOTO_ONLY = [
  "Fotoğraf işleniyor...",
  "Etiket metni okunuyor...",
  "İçerik/bileşenler tespit ediliyor...",
  "Zararlı/faydalı bileşenler değerlendiriliyor...",
  "Kullanıcı yorumları özetleniyor...",
];

export default function AnalyzingScreen({ route, navigation }: Props) {
  const { imageUri, backImageUri, barcode } = route.params;
  const { addAnalysis } = useHistory();
  const { registerScan } = useSubscription();
  const [stepIndex, setStepIndex] = useState(0);
  // Artık sadece "hata oldu" değil, hatanın GERÇEK metnini de tutuyoruz —
  // böylece ekranda ne olduğu (ağ hatası mı, 500 mü, hangi mesaj) doğrudan
  // okunabiliyor ve mock veri ile karıştırılmıyor.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const spin = useRef(new Animated.Value(0)).current;
  const STEPS = barcode ? STEPS_WITH_BARCODE : STEPS_PHOTO_ONLY;

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 900);

    let cancelled = false;
    (async () => {
      try {
        const analysis = await analyzeProductPhoto(imageUri, barcode, backImageUri);
        if (cancelled) return;
        await addAnalysis(analysis);
        await registerScan();
        navigation.replace("Result", { analysis });
      } catch (e: any) {
        console.warn("[AnalyzingScreen] Analiz başarısız:", e);
        if (!cancelled) setErrorMsg(e?.message || "Bilinmeyen hata");
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(stepTimer);
    };
  }, [imageUri]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        {errorMsg ? (
          <>
            <Text style={styles.errorTitle}>Analiz başarısız oldu</Text>
            <Text style={styles.errorText} selectable>
              {errorMsg}
            </Text>
            <Text style={styles.errorHint}>
              Bu ekranın fotoğrafını gönderirsen sorunu doğrudan bu mesajdan bulabiliriz.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.retryButtonText}>Geri Dön</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.lg }} />
            <Text style={styles.stepText}>{STEPS[stepIndex]}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  image: { width: 180, height: 180, borderRadius: radius.lg, opacity: 0.9 },
  stepText: { color: colors.textMuted, fontSize: 14, marginTop: spacing.sm },
  errorTitle: { color: colors.danger, fontSize: 16, fontWeight: "700", marginTop: spacing.lg },
  errorText: {
    color: colors.text,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  errorHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryButtonText: { color: colors.text, fontWeight: "600" },
});