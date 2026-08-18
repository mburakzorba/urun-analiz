import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius } from "../theme";
import { useHistory } from "../context/HistoryContext";
import { useSubscription } from "../context/SubscriptionContext";
import { shortHealthVerdict } from "../utils/verdict";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

export default function HistoryScreen({ navigation }: Props) {
  const { history, clearHistory } = useHistory();
  const { state } = useSubscription();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleCompareMode = () => {
    if (!compareMode && !state.isPremium) {
      // Karşılaştırma premium bir özellik — abone değilse Paywall'a yönlendir.
      Alert.alert(
        "Premium Özellik",
        "Ürün karşılaştırma Premium üyelere özel. Premium'a geçerek sınırsız tarama ve karşılaştırma özelliğini açabilirsin.",
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Premium'a Bak", onPress: () => navigation.navigate("Paywall") },
        ]
      );
      return;
    }
    setCompareMode((v) => !v);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // en eski seçimi at, yenisini ekle
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedIds.length !== 2) return;
    const a = history.find((h) => h.id === selectedIds[0]);
    const b = history.find((h) => h.id === selectedIds[1]);
    if (a && b) {
      navigation.navigate("Compare", { a, b });
      setCompareMode(false);
      setSelectedIds([]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Geçmiş Taramalar</Text>
        {history.length > 0 ? (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearBtn}>Temizle</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      {history.length >= 2 && (
        <TouchableOpacity onPress={toggleCompareMode} style={styles.compareToggle}>
          <Text style={styles.compareToggleText}>
            {compareMode ? "✕ Karşılaştırmayı İptal Et" : "⚖️ İki Ürünü Karşılaştır"}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Henüz kayıtlı tarama yok.</Text>}
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.id);
          return (
            <TouchableOpacity
              style={[styles.item, compareMode && selected && styles.itemSelected]}
              onPress={() =>
                compareMode ? toggleSelect(item.id) : navigation.navigate("Result", { analysis: item })
              }
            >
              {compareMode && (
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
              )}
              <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleString("tr-TR")}</Text>
              </View>
              <View style={[styles.scoreBadge, { borderColor: shortHealthVerdict(item.healthScore).color }]}>
                <Text style={[styles.scoreBadgeText, { color: shortHealthVerdict(item.healthScore).color }]}>
                  {shortHealthVerdict(item.healthScore).label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {compareMode && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.compareBtn, selectedIds.length !== 2 && styles.compareBtnDisabled]}
            onPress={handleCompare}
            disabled={selectedIds.length !== 2}
          >
            <Text style={styles.compareBtnText}>Karşılaştır ({selectedIds.length}/2)</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: { color: colors.accent, fontSize: 15 },
  title: { color: colors.text, fontSize: 17, fontWeight: "700" },
  clearBtn: { color: colors.danger, fontSize: 13 },
  compareToggle: {
    alignSelf: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  compareToggleText: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  listContainer: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xl * 2 },
  emptyText: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemSelected: { borderColor: colors.primary, backgroundColor: "rgba(74, 222, 128, 0.08)" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkboxTick: { color: "#0F1115", fontSize: 13, fontWeight: "800" },
  itemImage: { width: 56, height: 56, borderRadius: radius.sm },
  itemTitle: { color: colors.text, fontSize: 14, fontWeight: "600" },
  itemDate: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  scoreBadge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scoreBadgeText: { fontWeight: "700", fontSize: 12 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  compareBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  compareBtnDisabled: { backgroundColor: colors.cardAlt },
  compareBtnText: { color: "#0F1115", fontWeight: "800", fontSize: 15 },
});