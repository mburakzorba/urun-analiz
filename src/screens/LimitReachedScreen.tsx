import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, accent as accentRamp } from "../theme";
import { useSubscription } from "../context/SubscriptionContext";
import { StarIcon } from "../components/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "LimitReached">;

// Tasarım kaynağı: "L Limit doldu" ekranı (9 Eylül 2026). Önceden, ücretsiz
// plan hakkı bitince HomeScreen'deki "Analiz et" butonu sadece DEVRE DIŞI
// kalıyordu (dokununca hiçbir şey olmuyordu) — bu tasarımdaki ekran hiç
// gösterilemiyordu. Artık HomeScreen bu durumda butonu devre dışı bırakmak
// yerine bu ekrana yönlendiriyor (bkz. HomeScreen.tsx > handleScanPress).
export default function LimitReachedScreen({ navigation }: Props) {
  const { state } = useSubscription();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBadge}>
          <StarIcon size={26} color={colors.primaryDark} />
        </View>
        <Text style={styles.title}>Deneme hakkın doldu</Text>
        <Text style={styles.subtitle}>
          Ücretsiz plandaki {state.freeScansLimit} ürün analizini kullandın. Premium ile sınırsız analiz ve derin
          bileşen raporu açılır.
        </Text>

        <View style={styles.planCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.planTitle}>Aylık plan</Text>
            <Text style={styles.planSub}>İptal edilebilir</Text>
          </View>
          <Text style={styles.planPrice}>89,99 ₺</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.replace("Paywall")} activeOpacity={0.9} style={{ width: "100%" }}>
          <View style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Premium'a geç</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={{ marginTop: spacing.md }}>
          <Text style={styles.secondaryText}>Şimdi değil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: accentRamp[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { fontFamily: fontFamily.semibold, fontSize: 21, letterSpacing: -0.5, color: colors.text, marginBottom: 6, textAlign: "center" },
  subtitle: { color: colors.textMuted, fontSize: 12.5, lineHeight: 19, textAlign: "center", marginBottom: spacing.xl, paddingHorizontal: spacing.sm },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  planTitle: { color: colors.text, fontSize: 13.5, fontFamily: fontFamily.semibold },
  planSub: { color: colors.textFaint, fontSize: 11, marginTop: 2 },
  planPrice: { color: colors.text, fontSize: 15, fontFamily: fontFamily.bold },
  primaryBtn: {
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow(colors.primaryDark),
  },
  primaryBtnText: { color: "#fff", fontSize: 14.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  secondaryText: { color: colors.textMuted, fontSize: 13, fontFamily: fontFamily.semibold },
});
