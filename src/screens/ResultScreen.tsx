import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, good, warning, danger, accent2 } from "../theme";
import { AnalyzedIngredient, IngredientRisk } from "../types";
import {
  usabilityZone,
  sentimentZone,
  healthZone,
  overallScore as computeOverallScore,
  USABILITY_LABELS,
  SENTIMENT_LABELS,
  HEALTH_LABELS,
} from "../utils/verdict";
import ScoreRing from "../components/ScoreRing";
import GaugeTrack from "../components/GaugeTrack";
import SegmentedTabs from "../components/SegmentedTabs";
import { ChevronLeft, StarIcon, AlertTriangleIcon, CheckIcon } from "../components/Icon";
import { useUserProfile } from "../context/UserProfileContext";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;
type Tab = "genel" | "bilesenler" | "yorumlar";
type Filter = "tumu" | "riskli" | "dikkat" | "faydali";

function withOpacity(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const RISK_STYLE: Record<IngredientRisk, { bg: string; border: string; solid: string; text: string; label: string }> = {
  riskli: { bg: danger.bg, border: danger.border, solid: danger.solid, text: danger.text, label: "Riskli" },
  orta: { bg: warning.bg, border: warning.border, solid: warning.solid, text: warning.text, label: "Dikkatli kullan" },
  iyi: { bg: good.bg, border: good.border, solid: good.solid, text: good.text, label: "Faydalı" },
};

const sourceBadge: Record<string, { text: string; color: string }> = {
  mock: { text: "Örnek analiz (demo verisi)", color: colors.textMuted },
  ai: { text: "AI tahmini (fotoğraftan)", color: colors.primaryDark },
  "ai+barcode": { text: "✓ Barkodla doğrulanmış ürün", color: good.text },
  cache: { text: "✓ Daha önce analiz edildi (önbellekten)", color: accent2[700] },
};

function IngredientBox({ item }: { item: AnalyzedIngredient }) {
  const s = RISK_STYLE[item.risk];
  return (
    <View style={[styles.ibox, { backgroundColor: s.bg, borderLeftColor: s.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.iboxName, { color: s.text }]}>{item.name}</Text>
        <Text style={[styles.iboxDesc, { color: withOpacity(s.text, 0.75) }]}>{item.explanation}</Text>
      </View>
      <View style={[styles.iboxPill, { backgroundColor: s.solid }]}>
        <Text style={styles.iboxPillText}>{s.label}</Text>
      </View>
    </View>
  );
}

export default function ResultScreen({ route, navigation }: Props) {
  const { analysis, justAnalyzed } = route.params;
  const [tab, setTab] = useState<Tab>("genel");
  const [filter, setFilter] = useState<Filter>("tumu");
  const { profile } = useUserProfile();
  // 9 Eylül düzeltmesi (kullanıcı geri bildirimi — ekran görüntüsüyle
  // gösterildi): toast'ın "top" değeri eskiden SafeAreaView'in İÇ (padded)
  // kenarından değil, DIŞ kenarından ölçülüyordu — yani SafeAreaView'in
  // status bar için eklediği boşluğu YOK sayıp direkt en üstte, saat/pil
  // simgelerinin ÜZERİNDE/ARKASINDA çıkıyordu. useSafeAreaInsets().top'u
  // elle ekleyerek toast'ı gerçekten status bar'ın ALTINA indiriyoruz.
  const insets = useSafeAreaInsets();

  // 7 Eylül düzeltmesi: "Sana özel not" hiç görünmediğinde kullanıcı bunu bir
  // hata sanıyordu — oysa backend, KULLANICI PROFİLİNDE (cilt/saç tipi,
  // alerjiler) hiçbir gerçek veri yoksa bilerek boş bir not döndürüyor
  // (bkz. server/src/prompt.js). isProfileEmpty (Context'teki) sadece
  // completedAt'e bakıyor — ki bu, kullanıcı onboarding'de "Şimdilik atla"
  // dese bile true olabiliyor. Burada GERÇEKTEN hiçbir alan dolu mu diye
  // ayrıca kontrol ediyoruz, ki not neden yok açıkça anlaşılsın ve
  // kullanıcı isterse tek dokunuşla profiline gidip doldurabilsin.
  const hasProfileData = !!(
    profile.skinType ||
    profile.hairType ||
    profile.allergies.length > 0 ||
    profile.otherAllergyNote
  );

  const overallScore = computeOverallScore(analysis);
  const overall = usabilityZone(overallScore);
  const health = healthZone(analysis.healthScore);

  const counts = useMemo(() => {
    let riskli = 0, dikkat = 0, faydali = 0;
    for (const ing of analysis.ingredients) {
      if (ing.risk === "riskli") riskli++;
      else if (ing.risk === "orta") dikkat++;
      else faydali++;
    }
    return { riskli, dikkat, faydali, tumu: analysis.ingredients.length };
  }, [analysis.ingredients]);

  const filteredIngredients = useMemo(() => {
    if (filter === "tumu") return analysis.ingredients;
    const riskMap: Record<Exclude<Filter, "tumu">, IngredientRisk> = { riskli: "riskli", dikkat: "orta", faydali: "iyi" };
    return analysis.ingredients.filter((i) => i.risk === riskMap[filter as Exclude<Filter, "tumu">]);
  }, [analysis.ingredients, filter]);

  // 10 Eylül düzeltmesi (tasarım "B Sonucu paylaş" — son eksik ekran):
  // eskiden burada düz metinli bir Share.share() çağrısı vardı; artık
  // tasarımdaki gerçek, görsel/markalı paylaşım kartını gösteren ayrı bir
  // ekrana yönlendiriyoruz — bkz. ShareResultScreen.tsx.
  const handleShare = () => {
    navigation.navigate("ShareResult", { analysis });
  };

  // 9 Eylül düzeltmesi: eskiden burada sadece bir Alert gösterilip hiçbir
  // yere gerçekten kayıt gitmiyordu ("bildirimin bize ulaştı" demek yanlıştı).
  // Artık tasarımdaki "15 Sorun bildir" ekranına, bu analiz önceden seçili
  // olarak gidiyor — bkz. ReportProblemScreen.tsx.
  const handleReport = () => {
    navigation.navigate("ReportProblem", { analysis });
  };

  // "A Analiz kaydedildi" (tasarım) — analiz zaten AnalyzingScreen'de
  // addAnalysis() ile GERÇEKTEN kaydedildi (bu ekrana gelmeden önce); burada
  // sadece kısa bir onay/toast göstererek bunu kullanıcıya hissettiriyoruz,
  // ayrı bir ekrana/route'a çıkmadan.
  //
  // 10 Eylül düzeltmesi (kullanıcı geri bildirimi — "ürüne her girdiğimde
  // eklendi bildirimi geliyor, ilk analizden sonra gelmesin"): eskiden bu
  // efekt HER mount'ta (yani Geçmiş/Arama/Ana Sayfa'dan aynı ürüne tekrar
  // girildiğinde de) çalışıyordu — oysa ürün sadece İLK analiz edildiğinde
  // "geçmişe eklendi". Artık SADECE justAnalyzed=true iken (yeni bitmiş bir
  // analizden geliniyorsa, bkz. AnalyzingScreen.tsx) gösteriliyor.
  const savedToastOpacity = useRef(new Animated.Value(0)).current;
  const savedToastTranslate = useRef(new Animated.Value(-16)).current;
  useEffect(() => {
    if (!justAnalyzed) return;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(savedToastOpacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(savedToastTranslate, { toValue: 0, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.delay(1800),
      Animated.timing(savedToastOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [justAnalyzed]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {justAnalyzed && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.savedToast,
            // Not: "top: spacing.sm" yerine "top: insets.top + spacing.sm" —
            // yukarıdaki yorumdaki asıl düzeltme burada uygulanıyor.
            { top: insets.top + spacing.sm },
            { opacity: savedToastOpacity, transform: [{ translateY: savedToastTranslate }] },
          ]}
        >
          <View style={styles.savedToastIconWrap}>
            <CheckIcon size={12} color="#fff" strokeWidth={3} />
          </View>
          <Text style={styles.savedToastText} numberOfLines={1}>
            {(analysis.category || "Analiz")} geçmişine eklendi
          </Text>
        </Animated.View>
      )}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={15} color={colors.primaryDark} />
            <Text style={styles.backBtnText}>Anasayfa</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>↗ Paylaş</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRow}>
          <View style={styles.thumb} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.productName} numberOfLines={1}>{analysis.productName}</Text>
            {!!analysis.category && <Text style={styles.productMeta}>{analysis.category}</Text>}
            {sourceBadge[analysis.source] && (
              <View style={[styles.mockBadge, { backgroundColor: withOpacity(sourceBadge[analysis.source].color, 0.12) }]}>
                <Text style={[styles.mockBadgeText, { color: sourceBadge[analysis.source].color }]}>
                  {sourceBadge[analysis.source].text}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.segWrap}>
          <SegmentedTabs
            value={tab}
            onChange={setTab}
            options={[
              { key: "genel", label: "Genel" },
              { key: "bilesenler", label: "Bileşenler" },
              { key: "yorumlar", label: "Yorumlar" },
            ]}
          />
        </View>

        {tab === "genel" && (
          <>
            <View style={styles.scoreCard}>
              <ScoreRing score={overallScore} size={100} />
              <View style={{ flex: 1, minWidth: 0, marginLeft: 20 }}>
                <View style={[styles.overallPill, { backgroundColor: accent2[200] }]}>
                  <Text style={[styles.overallPillText, { color: accent2[700] }]}>{overall.label}</Text>
                </View>
                <Text style={styles.overallNote}>
                  Sağlık {health.label.toLowerCase()}, genel kullanılabilirlik {overall.label.toLowerCase()} olarak değerlendirildi.
                </Text>
              </View>
            </View>

            <GaugeTrack
              title="Sağlık"
              score={analysis.healthScore}
              zoneFor={healthZone}
              labels={HEALTH_LABELS}
            />
            <GaugeTrack
              title="Genel kullanılabilirlik"
              score={overallScore}
              zoneFor={usabilityZone}
              labels={USABILITY_LABELS}
            />

            {!!analysis.personalizedNote ? (
              <View style={styles.noteCard}>
                <View style={styles.noteHeaderRow}>
                  <StarIcon size={14} color={accent2[700]} />
                  <Text style={styles.noteTitle}>Sana özel not</Text>
                </View>
                <Text style={styles.noteText}>{analysis.personalizedNote}</Text>
              </View>
            ) : (
              // Not boş — çoğunlukla bir hata değil, profilde cilt/saç
              // tipi ya da alerji bilgisi olmadığı için AI kişiselleştirilmiş
              // bir şey üretemiyor. Kullanıcıya bunu açıkça söylüyor ve
              // profiline gitmesi için tek dokunuşluk bir yol sunuyoruz.
              !hasProfileData && (
                <TouchableOpacity
                  style={styles.noteNudgeCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("ProfileEdit")}
                >
                  <View style={styles.noteHeaderRow}>
                    <StarIcon size={14} color={accent2[700]} />
                    <Text style={styles.noteTitle}>Sana özel not</Text>
                  </View>
                  <Text style={styles.noteText}>
                    Cilt tipini, saç tipini veya alerjilerini profiline eklersen, bu ürüne özel kişisel bir
                    değerlendirme burada görünür.
                  </Text>
                  <Text style={styles.noteNudgeLink}>Profili tamamla →</Text>
                </TouchableOpacity>
              )
            )}

            <View style={styles.accentCard}>
              <Text style={styles.accentCardTitle}>Gerçekten işe yarıyor mu?</Text>
              <Text style={styles.paragraph}>{analysis.effectivenessSummary}</Text>
            </View>

            {!!analysis.usageFrequency && (
              <View style={styles.accentCard}>
                <Text style={styles.accentCardTitle}>Ne sıklıkla kullanmalısın?</Text>
                <Text style={styles.paragraph}>{analysis.usageFrequency}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.reportBtn} onPress={handleReport} activeOpacity={0.8}>
              <AlertTriangleIcon size={14} color={colors.primaryDark} />
              <Text style={styles.reportBtnText}>Sorun bildir</Text>
            </TouchableOpacity>
            <Text style={styles.disclaimer}>{analysis.disclaimer}</Text>
          </>
        )}

        {tab === "bilesenler" && (
          <>
            <View style={styles.filterRow}>
              <FilterPill label="Tümü" count={counts.tumu} active={filter === "tumu"} onPress={() => setFilter("tumu")} dark />
              <FilterPill label="Riskli" count={counts.riskli} active={filter === "riskli"} onPress={() => setFilter("riskli")} />
              <FilterPill label="Dikkat" count={counts.dikkat} active={filter === "dikkat"} onPress={() => setFilter("dikkat")} />
              <FilterPill label="Faydalı" count={counts.faydali} active={filter === "faydali"} onPress={() => setFilter("faydali")} />
            </View>

            <View style={{ marginTop: spacing.sm }}>
              {filteredIngredients.map((ing, idx) => (
                <IngredientBox key={`${idx}-${ing.name}`} item={ing} />
              ))}
              {filteredIngredients.length === 0 && (
                <Text style={styles.emptyText}>Bu kategoride bileşen bulunmuyor.</Text>
              )}
            </View>

            <TouchableOpacity style={styles.reportBtn} onPress={handleReport} activeOpacity={0.8}>
              <AlertTriangleIcon size={14} color={colors.primaryDark} />
              <Text style={styles.reportBtnText}>Yanlış bileşen mi okundu? Bildir</Text>
            </TouchableOpacity>
            <Text style={styles.disclaimer}>Bileşen değerlendirmeleri bilgilendirme amaçlıdır, tıbbi tavsiye değildir.</Text>
          </>
        )}

        {tab === "yorumlar" && (
          <>
            <GaugeTrack
              title="Kullanıcı görüşü"
              score={analysis.reviewSummary.averageSentiment}
              zoneFor={sentimentZone}
              labels={SENTIMENT_LABELS}
              badgeLabel={`${sentimentZone(analysis.reviewSummary.averageSentiment).label} · ${analysis.reviewSummary.totalMentionsAnalyzed} yorum`}
            />

            {analysis.reviewSummary.positiveHighlights.length > 0 && (
              <>
                <Text style={styles.kicker}>Öne çıkan olumlu</Text>
                <View style={[styles.highlightBox, { backgroundColor: good.bg, borderColor: withOpacity(good.border, 0.3) }]}>
                  {analysis.reviewSummary.positiveHighlights.map((h, idx) => (
                    <View key={idx} style={styles.highlightRow}>
                      <View style={[styles.dot, { backgroundColor: accent2[500] }]} />
                      <Text style={[styles.highlightText, { color: accent2[800] }]}>{h}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {analysis.reviewSummary.negativeHighlights.length > 0 && (
              <>
                <Text style={styles.kicker}>Öne çıkan olumsuz</Text>
                <View style={[styles.highlightBox, { backgroundColor: danger.bg, borderColor: withOpacity(danger.border, 0.28) }]}>
                  {analysis.reviewSummary.negativeHighlights.map((h, idx) => (
                    <View key={idx} style={styles.highlightRow}>
                      <View style={[styles.dot, { backgroundColor: colors.primaryDark }]} />
                      <Text style={[styles.highlightText, { color: "#643312" }]}>{h}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {analysis.reviewSummary.sampleQuotes.length > 0 && (
              <>
                <Text style={styles.kicker}>Örnek yorumlar</Text>
                <View style={{ gap: spacing.xs }}>
                  {analysis.reviewSummary.sampleQuotes.map((q, idx) => {
                    const tone =
                      q.sentiment === "olumlu"
                        ? { bg: good.bg, border: withOpacity(good.border, 0.3), text: good.text }
                        : q.sentiment === "olumsuz"
                        ? { bg: danger.bg, border: withOpacity(danger.border, 0.28), text: danger.text }
                        : { bg: "#FFFDF9", border: colors.border, text: colors.textMuted };
                    return (
                      <View key={idx} style={[styles.quoteBox, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                        <Text style={[styles.quoteText, { color: tone.text }]}>"{q.text}"</Text>
                        <View style={[styles.quotePill, { backgroundColor: "#fff" }]}>
                          <Text style={[styles.quotePillText, { color: tone.text }]}>{q.sentiment}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.disclaimer}>Bu değerlendirme tıbbi tavsiye değildir. Cilt rahatsızlığı durumunda bir dermatologa danışın.</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterPill({ label, count, active, onPress, dark }: { label: string; count: number; active: boolean; onPress: () => void; dark?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.filterPill,
        active ? (dark ? styles.filterPillDark : styles.filterPillActive) : styles.filterPillInactive,
      ]}
    >
      <Text style={[styles.filterPillText, active && (dark ? styles.filterPillTextDark : styles.filterPillTextActive)]}>
        {label} <Text style={{ opacity: 0.55 }}>{count}</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  // 9 Eylül düzeltmesi: eskiden koyu, ekranın tamamına yayılan, status
  // bar'la kolayca karışan bir "bar" görünümündeydi. Artık daha küçük,
  // sola hizalı, beyaz kartlık — status bar'ın net altında, kendi
  // gölgesi/kenarlığıyla açıkça bir "bildirim kartı" gibi ayrışıyor.
  savedToast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 9,
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    maxWidth: "88%",
    ...shadows.lifted("#2E2B25"),
  },
  savedToastIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: good.solid,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  savedToastText: { color: colors.text, fontSize: 12, fontFamily: fontFamily.semibold, flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backBtnText: { color: colors.primaryDark, fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  shareBtn: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.cardAlt },
  shareBtnText: { color: colors.text, fontSize: 12, fontFamily: fontFamily.bold },

  headerRow: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: spacing.md },
  thumb: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.surface, flexShrink: 0 },
  productName: { fontSize: 17, fontFamily: fontFamily.bold, letterSpacing: -0.4, color: colors.text },
  productMeta: { color: colors.textMuted, fontSize: 12.5, marginTop: 3 },
  mockBadge: { marginTop: spacing.xs, alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  mockBadgeText: { fontSize: 10, fontFamily: fontFamily.bold },

  segWrap: { marginBottom: spacing.md },

  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: spacing.sm,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  overallPill: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8 },
  overallPillText: { fontSize: 11.5, fontFamily: fontFamily.bold },
  overallNote: { fontSize: 12.5, fontFamily: fontFamily.semibold, lineHeight: 18, color: colors.text },

  noteCard: { backgroundColor: accent2[100], borderRadius: radius.lg, borderWidth: 1, borderColor: withOpacity(colors.secondary, 0.2), padding: 17, marginBottom: spacing.sm },
  // Dolu nottakiyle aynı görünüm — sadece kenarlığı KESİKLİ (dashed), çünkü
  // bu bir SONUÇ değil, bir DAVET/eylem çağrısı ("dokunulabilir" hissi).
  noteNudgeCard: {
    backgroundColor: accent2[100],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: withOpacity(colors.secondary, 0.35),
    padding: 17,
    marginBottom: spacing.sm,
  },
  noteHeaderRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  noteTitle: { fontSize: 14, fontFamily: fontFamily.semibold, color: accent2[900] },
  noteText: { fontSize: 11.5, lineHeight: 18, color: accent2[900] },
  noteNudgeLink: { fontSize: 11.5, fontFamily: fontFamily.bold, color: accent2[700], marginTop: 8 },

  accentCard: { backgroundColor: colors.cardAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, borderLeftWidth: 4, borderLeftColor: colors.primary, padding: spacing.md, marginBottom: spacing.sm },
  accentCardTitle: { fontSize: 15, fontFamily: fontFamily.semibold, color: colors.text, marginBottom: 8 },
  paragraph: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },

  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 42,
    borderRadius: 999,
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: "rgba(198,113,57,0.35)",
    marginTop: 4,
  },
  reportBtnText: { color: colors.primaryDark, fontSize: 12.5, fontFamily: fontFamily.semibold },
  disclaimer: { color: colors.textMuted, fontSize: 10, marginTop: spacing.sm, lineHeight: 15, textAlign: "center", paddingHorizontal: 10 },

  filterRow: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  filterPill: { height: 30, borderRadius: 999, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  filterPillInactive: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.hairline },
  filterPillActive: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.hairline },
  filterPillDark: { backgroundColor: colors.text },
  filterPillText: { fontSize: 12, fontFamily: fontFamily.semibold, color: colors.textMuted },
  filterPillTextActive: { color: colors.text },
  filterPillTextDark: { color: "#F9F4ED" },

  ibox: { borderRadius: radius.md, padding: 13, marginBottom: 8, borderLeftWidth: 4, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  iboxName: { fontSize: 13, fontFamily: fontFamily.semibold },
  iboxDesc: { fontSize: 11, marginTop: 3, lineHeight: 15 },
  iboxPill: { borderRadius: 999, paddingHorizontal: 9, height: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iboxPillText: { color: "#fff", fontSize: 10, fontFamily: fontFamily.bold },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: "center", paddingVertical: spacing.lg },

  kicker: { fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", fontFamily: fontFamily.bold, color: colors.textFaint, marginBottom: 8, marginTop: 4 },
  highlightBox: { borderRadius: radius.lg, borderWidth: 1.5, padding: 15, gap: 8, marginBottom: spacing.sm },
  highlightRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 999, marginTop: 6, flexShrink: 0 },
  highlightText: { flex: 1, fontSize: 11.5, lineHeight: 17 },

  quoteBox: { borderRadius: radius.lg, borderWidth: 1, padding: 13 },
  quoteText: { fontSize: 11.5, lineHeight: 17, fontStyle: "italic" },
  quotePill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, height: 20, alignItems: "center", justifyContent: "center", marginTop: 8 },
  quotePillText: { fontSize: 9.5, fontFamily: fontFamily.semibold, textTransform: "capitalize" },
});
