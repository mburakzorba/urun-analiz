import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, accent as accentRamp, danger } from "../theme";
import { useSubscription } from "../context/SubscriptionContext";
import { ChevronLeft, StarIcon, CreditCardIcon } from "../components/Icon";
import { PLAN_INFO, addInterval, YEARLY_SAVINGS_PERCENT } from "../utils/plans";

type Props = NativeStackScreenProps<RootStackParamList, "Subscription">;

function formatRenewalDate(periodStartISO: string, interval: "monthly" | "yearly"): string {
  const next = addInterval(periodStartISO, interval);
  return next.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

// Tasarım kaynağı: "J Aboneliğim" ekranı (9 Eylül 2026). NOT: tasarımda
// gösterilen "•••• 4821" gibi kayıtlı bir kart ve "720 ₺ · %25 tasarruf"
// yıllık plan, uygulamanın GERÇEK abonelik altyapısında (SubscriptionContext)
// yok — activatePremium() yerel bir demo bayrağı, kartla ilgili hiçbir bilgi
// tutulmuyor. Sahte bir kart numarası göstermek yanlış olur, o yüzden burada
// SADECE gerçekten var olan bilgiyi (plan/fiyat/yenileme tarihi, hesaplanmış)
// gösteriyoruz; "Ödeme yöntemi" ve "Yıllık plana geç" satırları tasarımdaki
// gibi duruyor ama dokununca dürüstçe "yakında" diyor. "Aboneliği iptal et"
// ise GERÇEK — cancelPremium() ile çalışıyor.
export default function SubscriptionScreen({ navigation }: Props) {
  const { state, cancelPremium } = useSubscription();
  const interval = state.planInterval || "monthly";
  const plan = PLAN_INFO[interval];

  const handleComingSoon = (title: string) =>
    Alert.alert(title, "Bu özellik şu anda uygulamanın demo sürümünde aktif değil — yakında eklenecek.");

  const handleCancel = () => {
    Alert.alert(
      "Aboneliği iptal et",
      "Premium aboneliğini iptal etmek istediğine emin misin? İptal edersen sınırsız analiz ve derin bileşen raporu kapanır.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "İptal Et",
          style: "destructive",
          onPress: async () => {
            await cancelPremium();
            Alert.alert("İptal edildi", "Premium aboneliğin iptal edildi.", [
              { text: "Tamam", onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
          <ChevronLeft size={15} color={colors.primaryDark} />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Aboneliğim</Text>

        {state.isPremium ? (
          <>
            <View style={styles.planCard}>
              <Text style={styles.sectionLabel}>Mevcut plan</Text>
              <View style={styles.planRow}>
                <View style={styles.planIconWrap}>
                  <StarIcon size={16} color={colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>Premium · {plan.label}</Text>
                  <Text style={styles.planSub}>
                    {plan.priceLabel} / {plan.periodLabel} · {formatRenewalDate(state.currentPeriodStart, interval)}'da yenilenir
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.planCard}>
              <Text style={styles.sectionLabel}>Ödeme yöntemi</Text>
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => handleComingSoon("Ödeme yöntemi")}
              >
                <CreditCardIcon size={16} color={colors.text} />
                <Text style={styles.rowText}>Ödeme yöntemini güncelle</Text>
              </TouchableOpacity>
              {/* 9 Eylül eklemesi: yıllık plan artık Paywall'dan seçilirken
                  GERÇEK (bkz. Payment/activatePremium). Ama zaten aktif olan
                  bir aboneliği aylıktan yıllığa MID-CYCLE çevirme (orantılı
                  fatura vb.) henüz yok — o yüzden bu satır hâlâ dürüstçe
                  "yakında" diyor; sadece ilk satın almadaki plan seçimi gerçek. */}
              {interval === "monthly" && (
                <TouchableOpacity
                  style={[styles.row, { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                  onPress={() => handleComingSoon("Yıllık plana geç")}
                >
                  <StarIcon size={16} color={colors.text} />
                  <Text style={styles.rowText}>Yıllık plana geç · %{YEARLY_SAVINGS_PERCENT} tasarruf</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => handleComingSoon("Makbuzlar")}
            >
              <Text style={[styles.rowText, { marginLeft: 0 }]}>Makbuzlar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>Aboneliği iptal et</Text>
            </TouchableOpacity>
            <Text style={styles.cancelNote}>İptal edersen dönem sonuna kadar Premium açık kalır.</Text>
          </>
        ) : (
          <View style={styles.planCard}>
            <Text style={styles.sectionLabel}>Mevcut plan</Text>
            <View style={styles.planRow}>
              <View style={styles.planIconWrap}>
                <StarIcon size={16} color={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>Ücretsiz</Text>
                <Text style={styles.planSub}>{state.freeScansLimit} ürün deneme hakkı / ay</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Paywall")} activeOpacity={0.9}>
              <View style={styles.upgradeBtn}>
                <Text style={styles.upgradeBtnText}>Premium'a geç</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.md },
  backText: { color: colors.primaryDark, fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.6, color: colors.text, marginBottom: spacing.lg },

  planCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionLabel: { fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: fontFamily.semibold, color: colors.textFaint, marginBottom: spacing.sm },
  planRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  planIconWrap: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  planTitle: { color: colors.text, fontSize: 14.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  planSub: { color: colors.textFaint, fontSize: 11, marginTop: 2 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowText: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold, marginLeft: 2 },

  upgradeBtn: {
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow(colors.primaryDark),
  },
  upgradeBtnText: { color: "#fff", fontSize: 14, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },

  cancelBtn: {
    marginTop: spacing.md,
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: danger.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { color: danger.text, fontSize: 13.5, fontFamily: fontFamily.semibold },
  cancelNote: { color: colors.textFaint, fontSize: 10.5, textAlign: "center", marginTop: spacing.sm, lineHeight: 15 },
});
