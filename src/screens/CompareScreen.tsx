import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, type, fontFamily, shadows, good, danger, accent as accentRamp } from "../theme";
import { ProductAnalysis } from "../types";
import { useUserProfile } from "../context/UserProfileContext";
// 7 Eylül düzeltmesi: bu ekranın "puan" hesabı artık burada tek başına
// tanımlı değil — Ana Sayfa/Geçmiş/Sonuç ile aynı sayıyı göstersin diye
// utils/verdict.ts'teki ortak overallScore()'a taşındı (bkz. oradaki not).
import { overallScore } from "../utils/verdict";

type Props = NativeStackScreenProps<RootStackParamList, "Compare">;

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
      {isWinner ? (
        <View style={styles.winnerTag}>
          <Text style={styles.winnerTagText}>Daha uygun</Text>
        </View>
      ) : (
        // Tasarım kaynağı: kazanan olmayan sütunda da pill'in yüksekliği kadar
        // boş alan bırakılıyor — ikisinin resim/isim satırı aynı yükseklikte
        // hizalı kalsın diye.
        <View style={styles.winnerTagPlaceholder} />
      )}
      <Image source={{ uri: p.imageUri }} style={styles.productImage} />
      <Text style={[styles.productName, isWinner && styles.productNameWinner]} numberOfLines={2}>
        {p.productName}
      </Text>
      {!!p.category && (
        <Text style={[styles.productCategory, isWinner && styles.productCategoryWinner]}>{p.category}</Text>
      )}
    </View>
  );
}

function CompareRow({
  label,
  valueA,
  valueB,
  aWins,
  bWins,
  isLast,
}: {
  label: string;
  valueA: string;
  valueB: string;
  aWins?: boolean;
  bWins?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValues}>
        <Text style={[styles.rowValue, aWins && styles.rowValueWinner, bWins && styles.rowValueLoser]}>
          {valueA}
        </Text>
        <Text style={[styles.rowValue, bWins && styles.rowValueWinner, aWins && styles.rowValueLoser]}>
          {valueB}
        </Text>
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
          <CompareRow
            label="Ne Sıklıkla"
            valueA={a.usageFrequency || "—"}
            valueB={b.usageFrequency || "—"}
            isLast
          />
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

// Tasarım kaynağı: "09 Geçmiş — karşılaştırma sonucu" ekranı — birebir aktarıldı
// (8 Eylül 2026, kullanıcının Claude Design export'undan). Kazanan sütun
// good.bg/good.border (#EAF5D8/#5F7A35), kaybeden/berabere sütun colors.cardAlt
// + ince hairline kenarlık; karşılaştırma kartındaki her satır kazananı
// good.text ile, kaybedeni soluk gri ile işaretliyor.
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  backBtnText: { color: accentRamp[600], fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.6, color: colors.text, marginBottom: spacing.md },
  columnsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  column: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    alignItems: "center",
  },
  columnWinner: { borderWidth: 2, borderColor: good.border, backgroundColor: good.bg },
  // Kazanan rozeti: tasarımda beyaz zeminli küçük bir pill (dolgu rengi değil).
  winnerTag: {
    height: 20,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  winnerTagText: { color: good.text, fontSize: 9.5, fontFamily: fontFamily.semibold },
  winnerTagPlaceholder: { height: 20, marginBottom: 9 },
  productImage: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: "#fff" },
  productName: {
    color: colors.text,
    fontSize: 12.5,
    fontFamily: fontFamily.semibold,
    letterSpacing: -0.2,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  productNameWinner: { color: good.text },
  productCategory: { color: colors.textFaint, fontSize: 11, textAlign: "center", marginTop: 2 },
  productCategoryWinner: { color: "rgba(59,77,32,0.6)" },
  tieText: { color: colors.textMuted, ...type.footnote, textAlign: "center", marginBottom: spacing.sm },
  compareCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  row: { paddingVertical: 9 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  // Tasarım kaynağı ".k": fontSize 10, letterSpacing .13em, uppercase, 600.
  rowLabel: { color: colors.textFaint, fontSize: 10, letterSpacing: 1.3, textTransform: "uppercase", fontFamily: fontFamily.semibold, marginBottom: 5 },
  rowValues: { flexDirection: "row", gap: spacing.sm },
  rowValue: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: 17,
    fontFamily: fontFamily.semibold,
    letterSpacing: -0.6,
  },
  rowValueWinner: { color: good.text },
  rowValueLoser: { color: colors.textFaint },
  allergyCard: {
    backgroundColor: danger.bg,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  allergyTitle: { color: danger.text, fontFamily: fontFamily.semibold, fontSize: 13, marginBottom: 4 },
  allergyText: { color: colors.text, fontSize: 12, marginTop: 2, lineHeight: 17 },
  disclaimer: { color: colors.textFaint, fontSize: 10, marginTop: spacing.lg, lineHeight: 15, textAlign: "center" },
});
