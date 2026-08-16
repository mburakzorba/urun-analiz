import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius } from "../theme";
import { useSubscription } from "../context/SubscriptionContext";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

const FEATURES = [
  "Sınırsız ürün taraması",
  "Detaylı bileşen / zararlı madde analizi",
  "Geniş kullanıcı yorumu özetleri",
  "Tarama geçmişini sınırsız saklama",
  "Yeni özelliklere erken erişim",
];

export default function PaywallScreen({ navigation }: Props) {
  const { activatePremium } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    // NOT: Bu demo bir buton — gerçek satın alma akışı değildir.
    // Gerçek App Store / Play Store aylık abonelik ürünü için
    // README.md > "Abonelik / Ödeme Entegrasyonu" bölümüne bakın.
    setLoading(true);
    try {
      await activatePremium();
      Alert.alert("Hoş geldin!", "Premium üyeliğin aktif edildi (demo).", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Premium'a Geç</Text>
        <Text style={styles.subtitle}>
          Aylık abonelikle kişisel bakım ürünlerini sınırsız tara, içeriklerini derinlemesine analiz et.
        </Text>

        <View style={styles.priceCard}>
          <Text style={styles.price}>₺49,99 / ay</Text>
          <Text style={styles.priceNote}>İstediğin zaman iptal edebilirsin</Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe} disabled={loading}>
          <Text style={styles.subscribeBtnText}>{loading ? "İşleniyor..." : "Şimdi Abone Ol"}</Text>
        </TouchableOpacity>

        <Text style={styles.demoNote}>
          Bu ekran demo amaçlıdır; gerçek ödeme App Store/Play Store abonelik ürünleri ile bağlanmalıdır.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg },
  closeBtn: { alignSelf: "flex-end", padding: spacing.sm },
  closeBtnText: { color: colors.textMuted, fontSize: 18 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: spacing.md },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: spacing.sm, lineHeight: 20 },
  priceCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  price: { color: colors.primary, fontSize: 28, fontWeight: "800" },
  priceNote: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  features: { marginTop: spacing.lg },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  featureCheck: { color: colors.primary, fontWeight: "800", marginRight: spacing.sm },
  featureText: { color: colors.text, fontSize: 14 },
  subscribeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  subscribeBtnText: { color: "#0F1115", fontWeight: "800", fontSize: 16 },
  demoNote: { color: colors.textMuted, fontSize: 11, textAlign: "center", marginTop: spacing.md },
});
