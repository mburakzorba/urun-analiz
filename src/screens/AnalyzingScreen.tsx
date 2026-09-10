import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows } from "../theme";
import { MascotIcon, WifiOffIcon, ImageOffIcon } from "../components/Icon";
import { analyzeProductPhoto } from "../services/analyzeProduct";
import { useHistory } from "../context/HistoryContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useUserProfile } from "../context/UserProfileContext";

// Yükleme halkasının boyutu/kalınlığı — hem SVG çizimi hem de dıştaki
// View boyutu bundan türetiliyor ki ikisi tam hizalı kalsın.
const RING_SIZE = 148;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
  const {
    imageUri,
    backImageUri,
    barcode,
    userProvidedName,
    userProvidedIngredients,
    userIntent,
    bothImagesAreIngredients,
  } = route.params;
  const { addAnalysis } = useHistory();
  const { registerScan } = useSubscription();
  const { profile } = useUserProfile();
  const [stepIndex, setStepIndex] = useState(0);
  // Artık sadece "hata oldu" değil, hatanın GERÇEK metnini de tutuyoruz —
  // böylece ekranda ne olduğu (ağ hatası mı, 500 mü, hangi mesaj) doğrudan
  // okunabiliyor ve mock veri ile karıştırılmıyor.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // analyzeProduct.ts, fetch'in kendisi başarısız olduğunda ("telefon
  // internete çıkamadı, Render servisi ayakta değil, DNS hatası vb.") hata
  // metnine hep "(ağ hatası)" ekliyor (bkz. services/analyzeProduct.ts) —
  // bunu kullanarak "Bağlantı yok" (E) ile "Etiket okunamadı" (D) tasarım
  // durumlarını ayırıyoruz.
  const isNetworkError = !!errorMsg && errorMsg.includes("ağ hatası");
  // Maskot logosunun etrafında dönen yükleme halkası (0 → 1 → tam tur).
  const spin = useRef(new Animated.Value(0)).current;
  // Maskotun kendisi de hafifçe "nefes alır" gibi büyüyüp küçülüyor —
  // ürün fotoğrafı yerine markanın kendisi "canlı" görünsün istedik.
  const pulse = useRef(new Animated.Value(0)).current;
  // Adım metni değişince hafif bir fade yapıyoruz — düz bir metin
  // değişiminden daha "premium" hissettiriyor, ekstra kütüphane gerekmiyor.
  const stepOpacity = useRef(new Animated.Value(1)).current;
  // İlerleme çubuğu, adım sayısına göre genişliyor (0 → 1). Gerçek network
  // ilerlemesini bilmiyoruz, bu yüzden adım index'ine dayalı bir TAHMİN —
  // yine de kullanıcıya "bir şeyler oluyor" hissini somutlaştırıyor.
  const progress = useRef(new Animated.Value(0)).current;
  const STEPS = barcode ? STEPS_WITH_BARCODE : STEPS_PHOTO_ONLY;

  useEffect(() => {
    // Halka sürekli döner...
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    // ...maskot da sürekli hafifçe büyüyüp küçülür (nefes alma efekti).
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(stepOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(stepOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    Animated.timing(progress, {
      toValue: (stepIndex + 1) / STEPS.length,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [stepIndex]);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 900);

    let cancelled = false;
    (async () => {
      try {
        const analysis = await analyzeProductPhoto(
          imageUri,
          barcode,
          backImageUri,
          profile,
          userProvidedName,
          userProvidedIngredients,
          userIntent,
          bothImagesAreIngredients
        );
        if (cancelled) return;
        await addAnalysis(analysis);
        await registerScan();
        // 10 Eylül eklemesi: SADECE burada, yeni bitmiş bir analizden sonra
        // justAnalyzed: true gönderiyoruz — bkz. navigation/types.ts'teki not.
        navigation.replace("Result", { analysis, justAnalyzed: true });
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

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {errorMsg ? (
          isNetworkError ? (
            // Tasarım kaynağı: "E Bağlantı yok" ekranı — errorMsg'in
            // analyzeProduct.ts'teki "Sunucuya bağlanılamadı (ağ hatası)"
            // metnini içerip içermediğine bakarak bu durumu ayırıyoruz (bkz.
            // isNetworkError). Genel "sunucu hatası" (400/500) durumu bunun
            // DIŞINDA kalır, aşağıdaki genel/etiket dalına düşer.
            <>
              <View style={styles.logoBadgeStatic}>
                <WifiOffIcon size={38} color={colors.danger} />
              </View>
              <Text style={styles.errorTitle}>Bağlantı yok</Text>
              <Text style={styles.errorHint}>
                Analiz için internet gerekiyor. Kaydettiğin ürünleri çevrimdışı görüntülemeye devam edebilirsin.
              </Text>
              <Text style={styles.errorDetail} selectable>
                {errorMsg}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => navigation.replace("Analyzing", route.params)}
              >
                <Text style={styles.retryButtonText}>Tekrar dene</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate("MainTabs", { screen: "History" })}
              >
                <Text style={styles.secondaryButtonText}>Kayıtlı analizleri aç</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Tasarım kaynağı: "D Etiket okunamadı" ekranı. UYARLAMA:
            // backend'in "hiç içerik listesi bulamadım" diye AYRI bir hata
            // döndüğü bir uç nokta yok (İÇERİK_LİSTESİ_YOK sadece dahili bir
            // ön-okuma adımında kullanılıyor, bkz. server/src/analyze.js) —
            // yani sunucudan gelen (ağ hatası DIŞINDAKİ) her hatayı, kullanıcı
            // için en olası ve en yardımcı açıklama olan "etiket net
            // okunamadı" çerçevesiyle gösteriyoruz; gerçek hata metni de
            // (errorDetail) altta duruyor, meraklısı/destek için.
            <>
              <View style={styles.logoBadgeStatic}>
                <ImageOffIcon size={38} color={colors.danger} />
              </View>
              <Text style={styles.errorTitle}>Etiket okunamadı</Text>
              <Text style={styles.errorHint}>
                Fotoğraftaki yazı net değil ya da içindekiler bölümü kadraja girmemiş olabilir.
              </Text>
              <View style={styles.tipsBox}>
                <Text style={styles.tipsTitle}>Daha iyi sonuç için</Text>
                <Text style={styles.tipItem}>• Ambalajı düz tut, parlamayı önlemek için ışığı yandan al.</Text>
                <Text style={styles.tipItem}>• "İçindekiler / Ingredients" başlığı kadraja tam girsin.</Text>
                <Text style={styles.tipItem}>• Uzun listelerde iki parça hâlinde çekebilirsin.</Text>
              </View>
              <Text style={styles.errorDetail} selectable>
                {errorMsg}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => navigation.replace("Scan")}>
                <Text style={styles.retryButtonText}>Tekrar çek</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.replace("Scan")}>
                <Text style={styles.secondaryButtonText}>Bileşenleri elle yaz</Text>
              </TouchableOpacity>
            </>
          )
        ) : (
          <>
            <View style={styles.logoWrap}>
              <Animated.View style={[styles.ring, { transform: [{ rotate: spinDeg }] }]}>
                <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={colors.hairline}
                    strokeWidth={RING_STROKE}
                    fill="none"
                  />
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={colors.primary}
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${RING_CIRCUMFERENCE * 0.28} ${RING_CIRCUMFERENCE}`}
                    fill="none"
                  />
                </Svg>
              </Animated.View>
              <Animated.View style={[styles.logoBadge, { transform: [{ scale: pulseScale }] }]}>
                <MascotIcon size={52} color={colors.primary} />
              </Animated.View>
            </View>
            <Animated.Text style={[styles.stepText, { opacity: stepOpacity }]}>{STEPS[stepIndex]}</Animated.Text>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                  },
                ]}
              />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  // Dönen halka + ortada nefes alan maskot — analiz sırasında ürün
  // fotoğrafı yerine markanın kendi logosu "canlı" bir yükleme animasyonu
  // olarak gösteriliyor.
  logoWrap: { width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: RING_SIZE, height: RING_SIZE },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  logoBadgeStatic: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  // ÖNEMLİ (kullanıcı geri bildirimi): eski hali colors.textMuted (%55
  // opaklık) kullanıyordu ve krem zemin üstünde neredeyse okunmuyordu.
  // Analiz adımı metni ekrandaki TEK bilgi olduğu için tam kontrastlı
  // (colors.text) ve yarı kalın yapıyoruz.
  stepText: {
    color: colors.text,
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  progressTrack: {
    width: 180,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.card,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
  errorTitle: { color: colors.danger, fontSize: 16, fontFamily: fontFamily.bold, marginTop: spacing.lg },
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
  // Gerçek hata metni (sunucudan/ağdan gelen ham mesaj) — artık ana mesaj
  // olarak değil, "meraklısı/destek için" küçük bir detay olarak gösteriliyor.
  errorDetail: {
    color: colors.textFaint,
    fontSize: 10.5,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  tipsBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginTop: spacing.md,
    alignSelf: "stretch",
  },
  tipsTitle: { color: colors.text, fontSize: 11.5, fontFamily: fontFamily.semibold, marginBottom: 6 },
  tipItem: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryButtonText: { color: colors.text, fontFamily: fontFamily.semibold },
  secondaryButton: { marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  secondaryButtonText: { color: colors.primaryDark, fontFamily: fontFamily.semibold, fontSize: 12.5 },
});
