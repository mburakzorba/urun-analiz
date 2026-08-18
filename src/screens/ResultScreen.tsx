import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius } from "../theme";
import { AnalyzedIngredient, IngredientRisk } from "../types";
import { effectivenessVerdict, healthVerdict, satisfactionVerdict } from "../utils/verdict";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

const riskColor: Record<IngredientRisk, string> = {
  iyi: colors.primary,
  orta: colors.warning,
  riskli: colors.danger,
};

const riskLabel: Record<IngredientRisk, string> = {
  iyi: "Faydalı",
  orta: "Dikkatli Kullan",
  riskli: "Riskli",
};

const sourceBadge: Record<string, { text: string; color: string }> = {
  mock: { text: "Örnek analiz (demo verisi)", color: colors.textMuted },
  ai: { text: "AI tahmini (fotoğraftan)", color: colors.warning },
  "ai+barcode": { text: "✓ Barkodla doğrulanmış ürün", color: colors.primary },
  cache: { text: "✓ Daha önce analiz edildi (önbellekten)", color: colors.accent },
};

function VerdictCard({ title, verdict }: { title: string; verdict: { label: string; color: string } }) {
  return (
    <View style={[styles.verdictCard, { borderColor: verdict.color }]}>
      <Text style={styles.verdictTitle}>{title}</Text>
      <Text style={[styles.verdictLabel, { color: verdict.color }]}>{verdict.label}</Text>
    </View>
  );
}

function IngredientRow({ item }: { item: AnalyzedIngredient }) {
  return (
    <View style={styles.ingredientRow}>
      <View style={[styles.riskDot, { backgroundColor: riskColor[item.risk] }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.ingredientName}>{item.name}</Text>
        <Text style={styles.ingredientExplanation}>{item.explanation}</Text>
      </View>
      <View style={[styles.riskBadge, { borderColor: riskColor[item.risk] }]}>
        <Text style={[styles.riskBadgeText, { color: riskColor[item.risk] }]}>{riskLabel[item.risk]}</Text>
      </View>
    </View>
  );
}

export default function ResultScreen({ route, navigation }: Props) {
  const { analysis } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Anasayfa</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Image source={{ uri: analysis.imageUri }} style={styles.productImage} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.productName}>{analysis.productName}</Text>
            {!!analysis.category && <Text style={styles.productMeta}>{analysis.category}</Text>}
            {sourceBadge[analysis.source] && (
              <View style={[styles.mockBadge, { borderColor: sourceBadge[analysis.source].color }]}>
                <Text style={[styles.mockBadgeText, { color: sourceBadge[analysis.source].color }]}>
                  {sourceBadge[analysis.source].text}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.scoresRow}>
          <VerdictCard title="İşe Yarıyor mu?" verdict={effectivenessVerdict(analysis.effectivenessScore)} />
          <VerdictCard title="Sağlık" verdict={healthVerdict(analysis.healthScore)} />
          <VerdictCard title="Kullanıcı Görüşü" verdict={satisfactionVerdict(analysis.reviewSummary.averageSentiment)} />
        </View>

        {!!analysis.personalizedNote && (
          <View style={styles.personalizedCard}>
            <Text style={styles.personalizedTitle}>✨ Sana Özel Değerlendirme</Text>
            <Text style={styles.personalizedText}>{analysis.personalizedNote}</Text>
          </View>
        )}

        <Section title="Gerçekten İşe Yarıyor mu?">
          <Text style={styles.paragraph}>{analysis.effectivenessSummary}</Text>
        </Section>

        {!!analysis.usageFrequency && (
          <Section title="⏱ Ne Sıklıkla Kullanmalısın?">
            <Text style={styles.paragraph}>{analysis.usageFrequency}</Text>
          </Section>
        )}

        {analysis.harmfulIngredients.length > 0 && (
          <Section title="⚠️ Dikkat Edilmesi Gereken Bileşenler">
            {analysis.harmfulIngredients.map((ing) => (
              <IngredientRow key={ing.name} item={ing} />
            ))}
          </Section>
        )}

        {analysis.beneficialIngredients.length > 0 && (
          <Section title="✅ Faydalı Bileşenler">
            {analysis.beneficialIngredients.map((ing) => (
              <IngredientRow key={ing.name} item={ing} />
            ))}
          </Section>
        )}

        <Section title="Tüm İçerik Listesi">
          {analysis.ingredients.map((ing) => (
            <IngredientRow key={ing.name} item={ing} />
          ))}
        </Section>

        <Section title="Kullanıcılar Ne Diyor?">
          <Text style={styles.paragraph}>
            {analysis.reviewSummary.totalMentionsAnalyzed.toLocaleString("tr-TR")} kullanıcı yorumu/bahsi analiz
            edildi.
          </Text>

          <Text style={styles.subheading}>Öne çıkan olumlu noktalar</Text>
          {analysis.reviewSummary.positiveHighlights.map((h) => (
            <Text key={h} style={styles.bulletPositive}>• {h}</Text>
          ))}

          <Text style={styles.subheading}>Öne çıkan olumsuz noktalar</Text>
          {analysis.reviewSummary.negativeHighlights.map((h) => (
            <Text key={h} style={styles.bulletNegative}>• {h}</Text>
          ))}

          <Text style={styles.subheading}>Örnek yorumlar</Text>
          {analysis.reviewSummary.sampleQuotes.map((q) => (
            <View key={q.text} style={styles.quoteBox}>
              <Text style={styles.quoteText}>"{q.text}"</Text>
              <Text
                style={[
                  styles.quoteSentiment,
                  {
                    color:
                      q.sentiment === "olumlu"
                        ? colors.primary
                        : q.sentiment === "olumsuz"
                        ? colors.danger
                        : colors.textMuted,
                  },
                ]}
              >
                {q.sentiment}
              </Text>
            </View>
          ))}
        </Section>

        <Text style={styles.disclaimer}>{analysis.disclaimer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  backBtn: { marginBottom: spacing.md },
  backBtnText: { color: colors.accent, fontSize: 15, fontWeight: "600" },
  headerRow: { flexDirection: "row", marginBottom: spacing.lg },
  productImage: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.card },
  productName: { color: colors.text, fontSize: 19, fontWeight: "800" },
  productMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  mockBadge: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  mockBadgeText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  scoresRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg, gap: spacing.sm },
  verdictCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 66,
  },
  verdictTitle: { color: colors.textMuted, fontSize: 11, textAlign: "center" },
  verdictLabel: { fontSize: 12, fontWeight: "800", textAlign: "center", marginTop: 4 },
  personalizedCard: {
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  personalizedTitle: { color: colors.accent, fontSize: 14, fontWeight: "700", marginBottom: 4 },
  personalizedText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: spacing.sm },
  paragraph: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  subheading: { color: colors.text, fontSize: 13, fontWeight: "700", marginTop: spacing.sm, marginBottom: 4 },
  bulletPositive: { color: colors.primary, fontSize: 13, marginBottom: 4, lineHeight: 18 },
  bulletNegative: { color: colors.danger, fontSize: 13, marginBottom: 4, lineHeight: 18 },
  quoteBox: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  quoteText: { color: colors.text, fontSize: 13, fontStyle: "italic" },
  quoteSentiment: { fontSize: 11, marginTop: 4, textTransform: "uppercase" },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  riskDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: spacing.sm },
  ingredientName: { color: colors.text, fontSize: 14, fontWeight: "600" },
  ingredientExplanation: { color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  riskBadge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  riskBadgeText: { fontSize: 10, fontWeight: "700" },
  disclaimer: { color: colors.textMuted, fontSize: 11, marginTop: spacing.md, lineHeight: 16, textAlign: "center" },
});