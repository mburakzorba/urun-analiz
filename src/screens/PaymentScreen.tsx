import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows } from "../theme";
import { useSubscription } from "../context/SubscriptionContext";
import { ChevronLeft } from "../components/Icon";
import { getTier, ADDON } from "../utils/plans";

type Props = NativeStackScreenProps<RootStackParamList, "Payment">;

// 21 Eylül değişikliği (RevenueCat entegrasyonu): tasarım kaynağı "12 Ödeme"
// ekranı, örnek bir kayıtlı kart ve "Kart ekle / Apple Pay" seçimi
// gösteriyordu — ama Google Play Billing'de (Android, bu uygulamanın şu anki
// tek platformu) ödeme YÖNTEMİ seçimi uygulama içinde YAPILMAZ; "Satın al"a
// basınca Google Play'in KENDİ satın alma ekranı açılır ve kullanıcı kayıtlı
// kartını/Google Pay bakiyesini ORADA seçer. Bu yüzden burada artık bir
// yöntem seçici YOK — bu ekran sadece neyin alındığını özetliyor ve satın
// almayı BAŞLATIYOR; asıl ödeme akışı Google Play'e ait.
export default function PaymentScreen({ route, navigation }: Props) {
  const { activatePremium, purchaseAddon } = useSubscription();
  const params = route.params || { kind: "tier", tierId: "pro" as const };
  const isAddon = params.kind === "addon";
  const tier = params.kind === "tier" ? getTier(params.tierId) : null;

  const priceLabel = isAddon ? ADDON.priceLabel : tier!.priceLabel;
  const summaryTitle = isAddon ? `özünde · ${ADDON.name}` : `özünde Premium · ${tier!.name}`;
  const summarySub = isAddon
    ? `Tek seferlik satın alma — ${ADDON.extraScans} ek tarama, abonelik değil`
    : `Ayda ${tier!.scansPerMonth} tarama · her ay yenilenir, iptal edilebilir`;

  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (Platform.OS !== "android") {
      Alert.alert("Yakında", "Bu platformda satın alma henüz desteklenmiyor.");
      return;
    }
    setLoading(true);
    try {
      if (isAddon) {
        await purchaseAddon();
        navigation.replace("PaymentSuccess", { kind: "addon" });
      } else {
        await activatePremium(tier!.id);
        navigation.replace("PaymentSuccess", { kind: "tier" });
      }
    } catch (err) {
      console.warn("[PaymentScreen] Satın alma başarısız:", err);
      Alert.alert(
        "Satın alma tamamlanamadı",
        err instanceof Error ? err.message : "Bilinmeyen bir sorun oluştu, lütfen tekrar dene."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
          <ChevronLeft size={15} color={colors.primaryDark} />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ödeme</Text>

        <View style={styles.summaryCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>{summaryTitle}</Text>
            <Text style={styles.summarySub}>{summarySub}</Text>
          </View>
          <Text style={styles.summaryPrice}>{priceLabel}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Bugün ödenecek</Text>
          <Text style={styles.totalValue}>{priceLabel}</Text>
        </View>

        <Text style={styles.disclaimer}>
          "Öde ve başla"ya bastığında Google Play'in kendi güvenli satın alma ekranı açılır — kart/Google Pay
          bilgilerin Google Play üzerinden yönetilir, bu uygulama tarafından hiç görülmez veya saklanmaz.
        </Text>

        <TouchableOpacity onPress={handlePay} disabled={loading} activeOpacity={0.9} style={{ marginTop: spacing.md }}>
          <View style={styles.payBtn}>
            <Text style={styles.payBtnText}>{loading ? "İşleniyor..." : `${priceLabel} öde ve başla`}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.termsText}>Devam ederek Kullanım Koşulları ve Gizlilik Politikası'nı kabul ediyorsun.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.md },
  backText: { color: colors.primaryDark, fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.6, color: colors.text, marginBottom: spacing.lg },

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  summaryTitle: { color: colors.text, fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  summarySub: { color: colors.textFaint, fontSize: 10.5, marginTop: 3 },
  summaryPrice: { color: colors.text, fontSize: 15, fontFamily: fontFamily.bold },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  totalLabel: { color: colors.textMuted, fontSize: 12.5, fontFamily: fontFamily.semibold },
  totalValue: { color: colors.text, fontSize: 12.5, fontFamily: fontFamily.bold },

  disclaimer: { color: colors.textFaint, fontSize: 10.5, lineHeight: 15, marginTop: spacing.xs, marginBottom: spacing.sm },

  payBtn: {
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow(colors.primaryDark),
  },
  payBtnText: { color: "#fff", fontSize: 14.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  termsText: { color: colors.textFaint, fontSize: 10, textAlign: "center", marginTop: spacing.md, lineHeight: 15 },
});
