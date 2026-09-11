import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
// 10 Eylül eklemesi (tasarım "B Sonucu paylaş" — 34 tasarımdan son eksik
// olan): bu ekran, Sonuç ekranındaki eski düz-metin `Share.share()` yerine
// tasarımdaki GERÇEK, görsel/markalı paylaşım kartını uyguluyor. Kartı bir
// PNG'ye "fotoğraflamak" için `react-native-view-shot` (native bir modül)
// kullanıyoruz — bu paket Expo Go'da ÇALIŞMAZ, bkz. NASIL_UYGULARIM.md'deki
// "ÖNEMLİ: Test yöntemi değişiyor" bölümü.
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Clipboard from "expo-clipboard";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, primaryGradient, primaryGradientLocations, good, danger } from "../theme";
import { AnalyzedIngredient, IngredientRisk } from "../types";
import { usabilityZone, overallScore as computeOverallScore } from "../utils/verdict";
import ScoreRing from "../components/ScoreRing";
import { ChevronLeft, CheckIcon, DownloadIcon, CopyIcon, MascotIcon, StarIcon } from "../components/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "ShareResult">;

const RISK_CHIP_STYLE: Record<IngredientRisk, { bg: string; text: string }> = {
  riskli: { bg: danger.bg, text: danger.text },
  orta: { bg: "#FFF1E3", text: "#7A4E12" },
  iyi: { bg: good.bg, text: good.text },
};

// Kartta "öne çıkan" gösterilecek en fazla 3 bileşen — önce riskli, sonra
// faydalı bileşenler öncelikli (kullanıcının en çok merak edeceği bilgi bu),
// "dikkatli kullan" bileşenler kart alanı kısıtlı olduğu için en son.
function pickNotableIngredients(ingredients: AnalyzedIngredient[]): AnalyzedIngredient[] {
  const riskli = ingredients.filter((i) => i.risk === "riskli");
  const iyi = ingredients.filter((i) => i.risk === "iyi");
  const orta = ingredients.filter((i) => i.risk === "orta");
  return [...riskli, ...iyi, ...orta].slice(0, 3);
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={onToggle} activeOpacity={0.75}>
      <View style={[styles.toggleBox, value && styles.toggleBoxActive]}>
        {value && <CheckIcon size={11} color="#fff" strokeWidth={3} />}
      </View>
      <Text style={styles.toggleLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ShareResultScreen({ route, navigation }: Props) {
  const { analysis } = route.params;
  const cardRef = useRef<View>(null);

  const overallScore = computeOverallScore(analysis);
  const overall = usabilityZone(overallScore);
  const notableIngredients = pickNotableIngredients(analysis.ingredients);
  const hasNote = !!analysis.personalizedNote;

  const [showScore, setShowScore] = useState(true);
  const [showIngredients, setShowIngredients] = useState(notableIngredients.length > 0);
  const [showNote, setShowNote] = useState(hasNote);

  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Kartın altyazı metni — hem galeri paylaşımının mesaj kısmında, hem de
  // "Metni kopyala" düğmesinde kullanılıyor.
  const summaryText = [
    `🧴 ${analysis.productName}`,
    analysis.brand ? `Marka: ${analysis.brand}` : null,
    "",
    `📊 Genel Kullanılabilirlik: ${overall.label} (${Math.round(overallScore)}/100)`,
    showIngredients && notableIngredients.length > 0
      ? `Öne çıkan bileşenler: ${notableIngredients.map((i) => i.name).join(", ")}`
      : null,
    showNote && analysis.personalizedNote ? `Sana özel not: ${analysis.personalizedNote}` : null,
    "",
    "özünde uygulamasıyla analiz edildi.",
  ]
    .filter((l): l is string => !!l)
    .join("\n");

  async function captureCard(): Promise<string> {
    if (!cardRef.current) throw new Error("Kart hazır değil");
    // "tmpfile" sonucu, gerek Share gerek MediaLibrary'nin beklediği bir
    // dosya URI'si döndürüyor (base64 yerine) — büyük kartlarda daha hızlı/
    // güvenilir.
    return captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
  }

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await captureCard();
      // iOS'ta "url" alanı resmi paylaşım sayfasına native olarak ekler;
      // Android'de de react-native'in Share API'si file:// URI'sini
      // destekliyor. "message" alanını Android'de de ekliyoruz ki alıcı
      // uygulama (WhatsApp/Instagram) hem görseli hem kısa metni alsın.
      await Share.share({ url: uri, message: Platform.OS === "android" ? summaryText : undefined });
    } catch (e) {
      Alert.alert("Paylaşılamadı", "Kart oluşturulurken bir sorun oluştu, tekrar dener misin?");
    } finally {
      setSharing(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "İzin gerekli",
          "Kartı galerine kaydedebilmemiz için fotoğraf/galeri izni vermen gerekiyor. Bunu telefonunun Ayarlar > özünde bölümünden açabilirsin."
        );
        return;
      }
      const uri = await captureCard();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Kaydedildi", "Kart galerine kaydedildi.");
    } catch (e) {
      Alert.alert("Kaydedilemedi", "Kart kaydedilirken bir sorun oluştu, tekrar dener misin?");
    } finally {
      setSaving(false);
    }
  };

  // Tasarımdaki "Bağlantı" butonu her ürün için gerçek/kalıcı bir web
  // sayfasına gidiyordu — uygulamada böyle bir ürün URL'si YOK (barkodla
  // doğrulanmış ürünlerde bile kendi paylaşılabilir bir sayfamız yok). Yanlış
  // bir link uydurmak yerine, dürüst bir karşılık olarak metni panoya
  // kopyalıyoruz; kullanıcı bunu istediği yere (mesaj, not vb.) yapıştırabilir.
  const handleCopyText = async () => {
    await Clipboard.setStringAsync(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={15} color={colors.primaryDark} />
          <Text style={styles.backBtnText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sonucu paylaş</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Yakalanacak (capture edilecek) kart — collapsable={false} RN'in bu
            View'ı native ağaçtan optimize edip silmesini engelliyor, aksi
            halde react-native-view-shot boş/hatalı bir görüntü yakalayabilir. */}
        <View ref={cardRef} collapsable={false} style={styles.card}>
          <LinearGradient
            colors={primaryGradient}
            locations={primaryGradientLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardHeaderStripe}
          />
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardProductName} numberOfLines={2}>
                  {analysis.productName}
                </Text>
                {!!analysis.brand && <Text style={styles.cardBrand}>{analysis.brand}</Text>}
              </View>
              {showScore && (
                <View style={styles.cardScoreWrap}>
                  <ScoreRing score={overallScore} size={72} />
                </View>
              )}
            </View>

            {showScore && (
              <View style={styles.cardPill}>
                <Text style={styles.cardPillText}>{overall.label}</Text>
              </View>
            )}

            {showIngredients && notableIngredients.length > 0 && (
              <View style={styles.chipRow}>
                {notableIngredients.map((ing, idx) => {
                  const s = RISK_CHIP_STYLE[ing.risk];
                  return (
                    <View key={idx} style={[styles.chip, { backgroundColor: s.bg }]}>
                      <Text style={[styles.chipText, { color: s.text }]} numberOfLines={1}>
                        {ing.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {showNote && !!analysis.personalizedNote && (
              <View style={styles.noteBox}>
                <View style={styles.noteHeaderRow}>
                  <StarIcon size={12} color={colors.primaryDark} />
                  <Text style={styles.noteTitle}>Sana özel not</Text>
                </View>
                <Text style={styles.noteText} numberOfLines={4}>
                  {analysis.personalizedNote}
                </Text>
              </View>
            )}

            <View style={styles.watermarkRow}>
              <MascotIcon size={18} color={colors.primaryDark} />
              <Text style={styles.watermarkText}>özünde ile analiz edildi</Text>
            </View>
          </View>
        </View>

        <View style={styles.toggleSection}>
          <Text style={styles.toggleSectionTitle}>Kartta göster</Text>
          <ToggleRow label="Puan" value={showScore} onToggle={() => setShowScore((v) => !v)} />
          {notableIngredients.length > 0 && (
            <ToggleRow label="Bileşen etiketleri" value={showIngredients} onToggle={() => setShowIngredients((v) => !v)} />
          )}
          {hasNote && <ToggleRow label="Kişisel notum" value={showNote} onToggle={() => setShowNote((v) => !v)} />}
        </View>

        <TouchableOpacity onPress={handleShare} activeOpacity={0.9} disabled={sharing}>
          <LinearGradient
            colors={primaryGradient}
            locations={primaryGradientLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>{sharing ? "Hazırlanıyor..." : "↗ Paylaş"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleSave} activeOpacity={0.8} disabled={saving}>
            <DownloadIcon size={15} color={colors.primaryDark} />
            <Text style={styles.secondaryBtnText}>{saving ? "Kaydediliyor..." : "Kaydet"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleCopyText} activeOpacity={0.8}>
            <CopyIcon size={15} color={colors.primaryDark} />
            <Text style={styles.secondaryBtnText}>{copied ? "Kopyalandı ✓" : "Metni kopyala"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, width: 52 },
  backBtnText: { color: colors.primaryDark, fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  title: { fontSize: 15, fontFamily: fontFamily.bold, color: colors.text },

  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },

  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: spacing.lg,
    ...shadows.lifted("#2E2B25"),
  },
  cardHeaderStripe: { height: 8, width: "100%" },
  cardBody: { padding: 20 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  cardProductName: { fontSize: 18, fontFamily: fontFamily.bold, letterSpacing: -0.4, color: colors.text },
  cardBrand: { fontSize: 12.5, color: colors.textMuted, marginTop: 3 },
  cardScoreWrap: { flexShrink: 0 },
  cardPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.cardAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 14,
  },
  cardPillText: { fontSize: 11.5, fontFamily: fontFamily.bold, color: colors.primaryDark },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, maxWidth: "100%" },
  chipText: { fontSize: 11, fontFamily: fontFamily.semibold },

  noteBox: {
    backgroundColor: "#FFF7EE",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(198,113,57,0.22)",
    padding: 13,
    marginTop: 14,
  },
  noteHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  noteTitle: { fontSize: 12, fontFamily: fontFamily.semibold, color: colors.primaryDark },
  noteText: { fontSize: 11.5, lineHeight: 17, color: colors.text },

  watermarkRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 18 },
  watermarkText: { fontSize: 11.5, fontFamily: fontFamily.bold, color: colors.textFaint, letterSpacing: -0.1 },

  toggleSection: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: 4,
  },
  toggleSectionTitle: { fontSize: 11, fontFamily: fontFamily.bold, color: colors.textFaint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  toggleBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBoxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleLabel: { fontSize: 13.5, fontFamily: fontFamily.semibold, color: colors.text },

  primaryBtn: {
    borderRadius: radius.pill,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow(colors.primaryDark),
  },
  primaryBtnText: { color: "#fff", fontFamily: fontFamily.semibold, fontSize: 14.5, letterSpacing: -0.2 },

  secondaryRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: "rgba(198,113,57,0.35)",
  },
  secondaryBtnText: { color: colors.primaryDark, fontSize: 12.5, fontFamily: fontFamily.semibold },
});
