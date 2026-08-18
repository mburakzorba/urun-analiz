import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius } from "../theme";
import { ProductAnalysis } from "../types";
import { useUserProfile } from "../context/UserProfileContext";

type Props = NativeStackScreenProps<RootStackParamList, "Compare">;

function overallScore(p: ProductAnalysis): number {
  return Math.round((p.healthScore + p.effectivenessScore) / 2);
}

function riskyCount(p: ProductAnalysis): number {
  return p.ingredients.filter((i) => i.risk === "riskli").length;
}

// Kullanıcının profilinde belirttiği alerjenlerden (isim bazlı, kaba bir
// eşleştirme) bu ürünün bileşen listesinde geçenleri bulur. Kesin bir INCI
// eşanlamlı sözlüğümüz yok, bu yüzden basit bir "içeriyor mu" kontrolü —
// yanlış negatif verebilir ama en azından bariz eşleşmeleri (örn. "Parfüm"
// seçiliyse "Parfum"/"Fragrance" içeren bir bileşen) yakalar.
function allergyMatches(p: ProductAnalysis, allergyTerms: string[]): string[] {
  if (!allergyTerms.length) return [];
  const matches = new Set<string>();
  const normalizedTerms = allergyTerms
    .map((t) => t.toLowerCase())
    .flatMap((t) => {
      // Yaygın kalıpları basitçe genişletiyoruz (parfüm -> parfum/fragrance vb.)
      if (t.includes("parfüm") || t.includes("parfum") || t.includes("fragrance")) {
        return ["parfum", "fragrance", "parfüm"];
      }
      if (t.includes("sülfat") || t.includes("sulfate")) return ["sulfate", "sülfat"];
      if (t.includes("paraben")) return ["paraben"];
      if (t.includes("alkol") || t.includes("alcohol")) return ["alcohol", "alkol"];
      return [t];
    });
  for (const ing of p.ingredients) {
    const name = ing.name.toLowerCase();
    if (normalizedTerms.some((term) => term && name.includes(term))) {
      matches.add(ing.name);
    }
  }
  return Array.from(matches);
}

function ProductColumn({ p, isWinner }: { p: ProductAnalysis; isWinner: boolean }) {
  return (
    <View style={[styles.column, isWinner && styles.columnWinner]}>
      {isWinner && <Text style={styles.winnerTag}>🏆 Daha Uygun</Text>}
      <Image source={{ uri: p.imageUri }} style={styles.productImage} />
      <Text style={styles.productName} numberOfLines={2}>
        {p.productName}
      </Text>
      {!!p.category && <Text style={styles.productCategory}>{p.category}</Text>}
    </View>
  );
}

function CompareRow({
  label,
  valueA,
  valueB,
  aWins,
  bWins,
}: {
  label: string;
  valueA: string;
  valueB: string;
  aWins?: boolean;
  bWins?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValues}>
        <Text style={[styles.rowValue, aWins && styles.rowValueWinner]}>{valueA}</Text>
        <Text style={[styles.rowValue, bWins && styles.rowValueWinner]}>{valueB}</Text>
      </View>
    </View>
  );
}

export default function CompareScreen({ route, navigation }: Props) {
  const { a, b } = route.params;
  const { profile } = useUserProfile();

  const scoreA = overallScore(a);
  const scoreB = overallScore(b);
  const riskyA = riskyCount(a);
  const riskyB = riskyCount(b);

  // Basit puanlama: genel skor, kullanıcı memnuniyeti ve riskli bileşen
  // sayısına göre her ürüne bir puan veriyoruz — hiçbir ekstra AI çağrısı
  // yapmadan, sadece elimizdeki (zaten analiz edilmiş) verilerden.
  let pointsA = 0;
  let pointsB = 0;
  if (scoreA !== scoreB) (scoreA > scoreB ? pointsA++ : pointsB++);
  if (a.reviewSummary.averageSentiment !== b.reviewSummary.averageSentiment) {
    a.reviewSummary.averageSentiment > b.reviewSummary.averageSentiment ? pointsA++ : pointsB++;
  }
  if (riskyA !== riskyB) (riskyA < riskyB ? pointsA++ : pointsB++);

  const winner = pointsA === pointsB ? null : pointsA > pointsB ? "a" : "b";

  const allergyTerms = [...(profile.allergies || []), ...(profile.otherAllergyNote ? [profile.otherAllergyNote] : [])];
  const allergyA = allergyMatches(a, allergyTerms);
  const allergyB = allergyMatches(b, allergyTerms);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ürün Karşılaştırma</Text>

        <View style={styles.columnsRow}>
          <ProductColumn p={a} isWinner={winner === "a"} />
          <ProductColumn p={b} isWinner={winner === "b"} />
        </View>

        {winner === null && (
          <Text style={styles.tieText}>İkisi de birbirine yakın — net bir kazanan yok.</Text>
        )}

        <View style={styles.compareCard}>
          <CompareRow
            label="Genel Kullanılabilirlik"
            valueA={`${scoreA}`}
            valueB={`${scoreB}`}
            aWins={scoreA > scoreB}
            bWins={scoreB > scoreA}
          />
          <CompareRow
            label="Sağlık Puanı"
            valueA={`${a.healthScore}`}
            valueB={`${b.healthScore}`}
            aWins={a.healthScore > b.healthScore}
            bWins={b.healthScore > a.healthScore}
          />
          <CompareRow
            label="Etkinlik Puanı"
            valueA={`${a.effectivenessScore}`}
            valueB={`${b.effectivenessScore}`}
            aWins={a.effectivenessScore > b.effectivenessScore}
            bWins={b.effectivenessScore > a.effectivenessScore}
          />
          <CompareRow
            label="Kullanıcı Memnuniyeti"
            valueA={`${a.reviewSummary.averageSentiment}`}
            valueB={`${b.reviewSummary.averageSentiment}`}
            aWins={a.reviewSummary.averageSentiment > b.reviewSummary.averageSentiment}
            bWins={b.reviewSummary.averageSentiment > a.reviewSummary.averageSentiment}
          />
          <CompareRow
            label="Riskli Bileşen Sayısı"
            valueA={`${riskyA}`}
            valueB={`${riskyB}`}
            aWins={riskyA < riskyB}
            bWins={riskyB < riskyA}
          />
          <CompareRow label="Ne Sıklıkla" valueA={a.usageFrequency || "—"} valueB={b.usageFrequency || "—"} />
        </View>

        {(allergyA.length > 0 || allergyB.length > 0) && (
          <View style={styles.allergyCard}>
            <Text style={styles.allergyTitle}>⚠️ Belirttiğin Alerjilerle Eşleşme</Text>
            {allergyA.length > 0 && (
              <Text style={styles.allergyText}>
                <Text style={{ fontWeight: "700" }}>{a.productName}: </Text>
                {allergyA.join(", ")}
              </Text>
            )}
            {allergyB.length > 0 && (
              <Text style={styles.allergyText}>
                <Text style={{ fontWeight: "700" }}>{b.productName}: </Text>
                {allergyB.join(", ")}
              </Text>
            )}
          </View>
        )}

        <Text style={styles.disclaimer}>
          Bu karşılaştırma, her iki ürün için daha önce yapılmış analizlerdeki puan ve bileşen verilerine dayanır;
          tıbbi tavsiye yerine geçmez.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  backBtn: { marginBottom: spacing.md },
  backBtnText: { color: colors.accent, fontSize: 15, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  columnsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  column: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  columnWinner: { borderColor: colors.primary, backgroundColor: "rgba(74, 222, 128, 0.08)" },
  winnerTag: { color: colors.primary, fontSize: 11, fontWeight: "800", marginBottom: 4 },
  productImage: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.cardAlt },
  productName: { color: colors.text, fontSize: 13, fontWeight: "700", textAlign: "center", marginTop: spacing.xs },
  productCategory: { color: colors.textMuted, fontSize: 11, textAlign: "center", marginTop: 2 },
  tieText: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginBottom: spacing.sm },
  compareCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { marginBottom: spacing.sm },
  rowLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  rowValues: { flexDirection: "row" },
  rowValue: { flex: 1, textAlign: "center", color: colors.text, fontSize: 14, fontWeight: "600" },
  rowValueWinner: { color: colors.primary, fontWeight: "800" },
  allergyCard: {
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  allergyTitle: { color: colors.danger, fontWeight: "700", fontSize: 13, marginBottom: 4 },
  allergyText: { color: colors.text, fontSize: 12, marginTop: 2, lineHeight: 17 },
  disclaimer: { color: colors.textMuted, fontSize: 11, marginTop: spacing.lg, lineHeight: 16, textAlign: "center" },
});