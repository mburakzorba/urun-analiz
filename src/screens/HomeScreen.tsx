import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius } from "../theme";
import { useSubscription } from "../context/SubscriptionContext";
import { useHistory } from "../context/HistoryContext";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { state, remainingFreeScans, canScan } = useSubscription();
  const { history } = useHistory();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ürün Analiz</Text>
          <Text style={styles.subtitle}>
            Kişisel bakım ürününün fotoğrafını çek; içeriğini, gerçekten işe yarayıp yaramadığını,
            zararlı/faydalı yönlerini ve kullanıcı yorumlarını öğren.
          </Text>
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planLabel}>{state.isPremium ? "Premium Üyelik" : "Ücretsiz Plan"}</Text>
          <Text style={styles.planDetail}>
            {state.isPremium
              ? "Sınırsız ürün taraması yapabilirsin."
              : `Bu ay ${remainingFreeScans}/${state.freeScansLimit} ücretsiz taramanız kaldı.`}
          </Text>
          {!state.isPremium && (
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate("Paywall")}>
              <Text style={styles.upgradeBtnText}>Premium'a Geç</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.scanBtn, !canScan && styles.scanBtnDisabled]}
          onPress={() => (canScan ? navigation.navigate("Scan") : navigation.navigate("Paywall"))}
        >
          <Text style={styles.scanBtnIcon}>📷</Text>
          <Text style={styles.scanBtnText}>
            {canScan ? "Ürün Fotoğrafı Çek" : "Aylık Hakkın Doldu — Premium'a Geç"}
          </Text>
        </TouchableOpacity>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Geçmiş Taramalar</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate("History")}>
              <Text style={styles.link}>Tümünü Gör</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <Text style={styles.emptyText}>Henüz bir ürün taramadın. Yukarıdan ilk taramanı başlat!</Text>
        ) : (
          <FlatList
            data={history.slice(0, 5)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.historyItem}
                onPress={() => navigation.navigate("Result", { analysis: item })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyItemTitle} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text style={styles.historyItemDate}>
                    {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                  </Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{item.healthScore}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 30, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 21 },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planLabel: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  planDetail: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  upgradeBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  upgradeBtnText: { color: "#0F1115", fontWeight: "700" },
  scanBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  scanBtnDisabled: { backgroundColor: colors.cardAlt },
  scanBtnIcon: { fontSize: 32, marginBottom: spacing.xs },
  scanBtnText: { color: "#0F1115", fontWeight: "700", fontSize: 16 },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  link: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyItemTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  historyItemDate: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  scoreBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBadgeText: { color: colors.primary, fontWeight: "700" },
});
