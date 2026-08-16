import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, Animated } from "react-native";
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
  const { imageUri, barcode } = route.params;
  const { addAnalysis } = useHistory();
  const { registerScan } = useSubscription();
  const [stepIndex, setStepIndex] = useState(0);
  const [errored, setErrored] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;
  const STEPS = barcode ? STEPS_WITH_BARCODE : STEPS_PHOTO_ONLY;

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 900);

    let cancelled = false;
    (async () => {
      try {
        const analysis = await analyzeProductPhoto(imageUri, barcode);
        if (cancelled) return;
        await addAnalysis(analysis);
        await registerScan();
        navigation.replace("Result", { analysis });
      } catch (e) {
        if (!cancelled) setErrored(true);
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
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.lg }} />
        {errored ? (
          <Text style={styles.errorText}>Analiz sırasında bir sorun oluştu. Lütfen tekrar dene.</Text>
        ) : (
          <Text style={styles.stepText}>{STEPS[stepIndex]}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  image: { width: 180, height: 180, borderRadius: radius.lg, opacity: 0.9 },
  stepText: { color: colors.textMuted, fontSize: 14 },
  errorText: { color: colors.danger, fontSize: 14, textAlign: "center" },
});
