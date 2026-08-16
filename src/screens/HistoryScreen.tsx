import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius } from "../theme";
import { useHistory } from "../context/HistoryContext";
import { shortHealthVerdict } from "../utils/verdict";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

export default function HistoryScreen({ navigation }: Props) {
  const { history, clearHistory } = useHistory();

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

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Henüz kayıtlı tarama yok.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate("Result", { analysis: item })}
          >
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
        )}
      />
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
  listContainer: { padding: spacing.lg, paddingTop: 0 },
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
});