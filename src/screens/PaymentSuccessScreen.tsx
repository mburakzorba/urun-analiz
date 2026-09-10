import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, good } from "../theme";
import { useSubscription } from "../context/SubscriptionContext";
import { CheckIcon } from "../components/Icon";
import { PLAN_INFO, addInterval } from "../utils/plans";

type Props = NativeStackScreenProps<RootStackParamList, "PaymentSuccess">;

function formatRenewalDate(periodStartISO: string, interval: "monthly" | "yearly"): string {
  const next = addInterval(periodStartISO, interval);
  return next.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

// Tasarım kaynağı: "I Ödeme başarılı" ekranı (9 Eylül 2026) — PaymentScreen'in
// (demo) "öde ve başla" butonundan sonra buraya düşülüyor.
export default function PaymentSuccessScreen({ navigation }: Props) {
  const { state } = useSubscription();
  const interval = state.planInterval || "monthly";
  const plan = PLAN_INFO[interval];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBadge}>
          <CheckIcon size={30} color="#fff" strokeWidth={3} />
        </View>
        <Text style={styles.title}>Premium aktif</Text>
        <Text style={styles.subtitle}>Ödemen alındı. Artık sınırsız analiz ve derin bileşen raporu açık.</Text>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Plan</Text>
            <Text style={styles.cardValue}>{plan.label} · {plan.priceLabel}</Text>
          </View>
          <View style={[styles.cardRow, { marginTop: spacing.sm }]}>
            <Text style={styles.cardLabel}>Sonraki yenileme</Text>
            <Text style={styles.cardValue}>{formatRenewalDate(state.currentPeriodStart, interval)}</Text>
          </View>
        </View>

        <TouchableOpacity
          // 9 Eylül düzeltmesi (kullanıcı geri bildirimi — "uygulama sekme
          // sekme ekranlara bölündü"): burası eskiden navigation.navigate
          // ile MainTabs/Home'a GİDİYORDU, ama Paywall→Payment→PaymentSuccess
          // zinciri Paywall'ın "modal" (sheet) sunumu İÇİNDE yaşıyor —
          // navigate() bu modal sunumunu düzgün KAPATMIYORDU, sonuç olarak
          // Ana Sayfa modal'ın YARIM kapanmış hâliyle (üstü yuvarlak köşeli,
          // arkası gri) görünüyordu. popToTop() ise tüm bu zinciri (ve
          // altındaki modal sunumu) TEK SEFERDE, düzgün bir kapanış
          // animasyonuyla kapatıp doğrudan Ana Sayfa'ya (yığının en altına)
          // dönüyor.
          onPress={() => navigation.popToTop()}
          activeOpacity={0.9}
          style={{ width: "100%" }}
        >
          <View style={styles.mainBtn}>
            <Text style={styles.mainBtnText}>Analize başla</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Makbuzlar", "Bu özellik şu anda uygulamanın demo sürümünde aktif değil — yakında eklenecek.")
          }
          activeOpacity={0.7}
          style={{ marginTop: spacing.md }}
        >
          <Text style={styles.secondaryText}>Makbuzu görüntüle</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: good.solid,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    ...shadows.lifted(good.solid),
  },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.6, color: colors.text, marginBottom: 6 },
  subtitle: { color: colors.textMuted, fontSize: 12.5, lineHeight: 19, textAlign: "center", marginBottom: spacing.lg, paddingHorizontal: spacing.sm },
  card: {
    width: "100%",
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: colors.textFaint, fontSize: 11.5, fontFamily: fontFamily.semibold },
  cardValue: { color: colors.text, fontSize: 12.5, fontFamily: fontFamily.semibold },
  mainBtn: {
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow(colors.primaryDark),
  },
  mainBtnText: { color: "#fff", fontSize: 14.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  secondaryText: { color: colors.primaryDark, fontSize: 12.5, fontFamily: fontFamily.semibold },
});
