import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, accent as accentRamp } from "../theme";
import { useSubscription } from "../context/SubscriptionContext";
import { StarIcon, PlusIcon } from "../components/Icon";
import { getTier, DEFAULT_TIER_ID, ADDON, CHEAPEST_TIER } from "../utils/plans";

type Props = NativeStackScreenProps<RootStackParamList, "LimitReached">;

// Tasarım kaynağı: "L Limit doldu" ekranı (9 Eylül 2026). Önceden, ücretsiz
// plan hakkı bitince HomeScreen'deki "Analiz et" butonu sadece DEVRE DIŞI
// kalıyordu (dokununca hiçbir şey olmuyordu) — bu tasarımdaki ekran hiç
// gösterilemiyordu. Artık HomeScreen bu durumda butonu devre dışı bırakmak
// yerine bu ekrana yönlendiriyor (bkz. HomeScreen.tsx > handleScanPress).
//
// 12 Eylül değişikliği: eskiden buraya SADECE ücretsiz hakkı biten
// kullanıcılar düşebiliyordu (fiyat da "89,99 ₺" diye SABİT/yanlış
// yazılmıştı — artık plans.ts'ten canlı okunuyor). Artık HomeScreen, canScan
// false olan HER durumda (ücretsiz hakkı biten VEYA paket kotası dolan
// Premium kullanıcı) buraya yönlendiriyor — bu yüzden ekran artık isPremium'a
// göre İKİ farklı, doğru mesaj/aksiyon seti gösteriyor.
export default function LimitReachedScreen({ navigation }: Props) {
  const { state } = useSubscription();
  const tier = getTier(state.tierId || DEFAULT_TIER_ID);

  const handleBuyAddon = () => navigation.navigate("Payment", { kind: "addon" });
  const handleUpgrade = () => navigation.replace("Paywall");

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBadge}>
          <StarIcon size={26} color={colors.primaryDark} />
        </View>

        {state.isPremium ? (
          <>
            <Text style={styles.title}>Bu ayki kotan doldu</Text>
            <Text style={styles.subtitle}>
              {tier.name} paketindeki {tier.scansPerMonth} taramanın hepsini bu ay kullandın. Ay sonuna kadar
              beklemeden devam etmek için ek tarama alabilir ya da daha yüksek kotalı bir pakete geçebilirsin.
            </Text>

            <TouchableOpacity onPress={handleBuyAddon} activeOpacity={0.9} style={{ width: "100%" }}>
              <View style={styles.primaryBtn}>
                <PlusIcon size={15} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  {ADDON.name} al · {ADDON.priceLabel}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUpgrade} activeOpacity={0.7} style={{ marginTop: spacing.md }}>
              <Text style={styles.secondaryText}>Paketi yükselt</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Deneme hakkın doldu</Text>
            <Text style={styles.subtitle}>
              Ücretsiz plandaki {state.freeScansLimit} ürün analizini kullandın. Premium paketlerle ayda{" "}
              {CHEAPEST_TIER.scansPerMonth}'den başlayan tarama hakkına, ya da abone olmadan tek seferlik ek
              taramaya geçebilirsin.
            </Text>

            <View style={styles.planCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{CHEAPEST_TIER.name}'tan itibaren</Text>
                <Text style={styles.planSub}>Ayda {CHEAPEST_TIER.scansPerMonth} tarama · iptal edilebilir</Text>
              </View>
              <Text style={styles.planPrice}>{CHEAPEST_TIER.priceLabel}</Text>
            </View>

            <TouchableOpacity onPress={handleUpgrade} activeOpacity={0.9} style={{ width: "100%" }}>
              <View style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Premium'a geç</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBuyAddon} activeOpacity={0.7} style={{ marginTop: spacing.md }}>
              <Text style={styles.secondaryText}>
                Sadece {ADDON.priceLabel} karşılığında {ADDON.extraScans} ek tarama al
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={{ marginTop: spacing.lg }}>
          <Text style={styles.dismissText}>Şimdi değil</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...shadows.glow(colors.primaryDark),
  },
  primaryBtnText: { color: "#fff", fontSize: 14.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  secondaryText: { color: colors.textMuted, fontSize: 13, fontFamily: fontFamily.semibold, textAlign: "center" },
  dismissText: { color: colors.textFaint, fontSize: 12.5, fontFamily: fontFamily.semibold },
});
