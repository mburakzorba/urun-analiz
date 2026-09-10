import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows } from "../theme";
import { useSubscription } from "../context/SubscriptionContext";
import { CreditCardIcon, ChevronLeft, CheckIcon } from "../components/Icon";
import { PLAN_INFO } from "../utils/plans";

type Props = NativeStackScreenProps<RootStackParamList, "Payment">;

// Tasarım kaynağı: "12 Ödeme" ekranı (9 Eylül 2026). ÖNEMLİ UYARLAMA:
// tasarımda örnek olarak zaten kayıtlı bir kart ("•••• 4821, Elif Y. ·
// 09/28") gösteriliyor — ama bu uygulamada gerçek bir ödeme altyapısı
// (Stripe/RevenueCat vb.) henüz YOK, dolayısıyla var olmayan bir kartı
// "kayıtlı" gibi göstermek yanıltıcı olurdu. Bu yüzden burada gerçek bir kart
// numarası GİRME ALANI da YOK, var olmayan bir kart da GÖSTERİLMİYOR — sadece
// "Kart ekle" / "Apple Pay" seçenekleri var, ikisi de seçilince aynı demo
// akışını (activatePremium) tetikliyor. README.md > "Abonelik / Ödeme
// Entegrasyonu" bölümünde anlatılan gerçek altyapı bağlandığında, bu ekran
// gerçek bir kart formu/Apple Pay sheet'i açacak şekilde güncellenebilir.
export default function PaymentScreen({ route, navigation }: Props) {
  const { activatePremium } = useSubscription();
  const interval = route.params?.interval || "monthly";
  const plan = PLAN_INFO[interval];
  const [method, setMethod] = useState<"card" | "applepay">("card");
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      await activatePremium(interval);
      navigation.replace("PaymentSuccess");
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
            <Text style={styles.summaryTitle}>özünde Premium · {plan.label}</Text>
            <Text style={styles.summarySub}>{plan.renewalNote}</Text>
          </View>
          <Text style={styles.summaryPrice}>{plan.priceLabel}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Bugün ödenecek</Text>
          <Text style={styles.totalValue}>{plan.priceLabel}</Text>
        </View>

        <Text style={styles.sectionLabel}>Ödeme yöntemi</Text>
        <TouchableOpacity
          style={[styles.methodRow, method === "card" && styles.methodRowActive]}
          activeOpacity={0.8}
          onPress={() => setMethod("card")}
        >
          <CreditCardIcon size={17} color={colors.text} />
          <Text style={styles.methodText}>Kredi veya banka kartı ekle</Text>
          {method === "card" && (
            <View style={styles.methodCheck}>
              <CheckIcon size={11} color="#fff" strokeWidth={3} />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodRow, method === "applepay" && styles.methodRowActive]}
          activeOpacity={0.8}
          onPress={() => setMethod("applepay")}
        >
          <View style={styles.appleGlyphWrap}>
            <Text style={styles.appleGlyphText}>Pay</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodText}>Apple Pay</Text>
            <Text style={styles.methodSub}>Tek dokunuşla öde</Text>
          </View>
          {method === "applepay" && (
            <View style={styles.methodCheck}>
              <CheckIcon size={11} color="#fff" strokeWidth={3} />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Ödemeler güvenli altyapı üzerinden alınır; kart bilgileri uygulamada saklanmaz.
        </Text>

        <TouchableOpacity onPress={handlePay} disabled={loading} activeOpacity={0.9} style={{ marginTop: spacing.md }}>
          <View style={styles.payBtn}>
            <Text style={styles.payBtnText}>{loading ? "İşleniyor..." : `${plan.priceLabel} öde ve başla`}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          Devam ederek Kullanım Koşulları ve Gizlilik Politikası'nı kabul ediyorsun. (Demo ödeme — gerçek bir tahsilat
          yapılmaz.)
        </Text>
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

  sectionLabel: { fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: fontFamily.semibold, color: colors.textFaint, marginBottom: spacing.sm },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  methodRowActive: { borderColor: colors.primary, backgroundColor: "#FFF8F1" },
  methodText: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold, flex: 1 },
  methodSub: { color: colors.textFaint, fontSize: 10.5, marginTop: 2 },
  appleGlyphWrap: { width: 30, height: 20, borderRadius: 5, backgroundColor: colors.text, alignItems: "center", justifyContent: "center" },
  appleGlyphText: { color: "#fff", fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: -0.2 },
  methodCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  disclaimer: { color: colors.textFaint, fontSize: 10.5, lineHeight: 15, marginTop: spacing.xs },

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
