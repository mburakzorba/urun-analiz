import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, good, warning, danger } from "../theme";
import { useHistory } from "../context/HistoryContext";
import { overallScore } from "../utils/verdict";
import { SearchIcon, CameraIcon, ChevronLeft } from "../components/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "Search">;

function scoreTierColors(score: number) {
  if (score >= 70) return good;
  if (score >= 45) return warning;
  return danger;
}

// Tasarım kaynağı: "G Ürün arama" ekranı. ÖNEMLİ UYARLAMA: tasarımdaki örnek
// ("Mineral Güneş Kremi 50+", "Sole · parfümsüz" vb.) genel bir ÜRÜN
// VERİTABANINDA arama yapıyormuş gibi görünüyor — ama bu uygulamada öyle bir
// veritabanı YOK (backend yalnızca fotoğraf/barkod analiz ediyor, önceden
// taranmamış bir ürünü "ara"yamazsın). Sahte bir ürün listesi göstermek
// yanıltıcı olurdu. Bu yüzden bu ekranı GERÇEK ve faydalı bir şeye
// çevirdik: kullanıcının KENDİ geçmiş taramaları içinde arama. Aramada
// bulamadıysa (yani hiç taramadıysa) tasarımdaki gibi "Etiketini çek" CTA'sı
// doğrudan kamerayı açıyor.
export default function SearchScreen({ navigation }: Props) {
  const { history } = useHistory();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (!q) return history;
    return history.filter((item) => {
      const haystack = `${item.productName} ${item.brand ?? ""} ${item.category ?? ""}`.toLocaleLowerCase("tr-TR");
      return haystack.includes(q);
    });
  }, [history, query]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={16} color={colors.primaryDark} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <SearchIcon size={15} color={colors.textFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Geçmiş taramalarında ara (ürün, marka, kategori)"
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
        </View>
      </View>

      {history.length > 0 && <Text style={styles.resultCount}>Sonuçlar · {results.length}</Text>}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const tierColors = scoreTierColors(overallScore(item));
          return (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("Result", { analysis: item })}
            >
              <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.itemMeta} numberOfLines={1}>
                  {item.brand ? `${item.brand} · ` : ""}
                  {item.category || "Analiz"}
                </Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: tierColors.solid }]}>
                <Text style={styles.scoreBadgeText}>{overallScore(item)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              {history.length === 0 ? "Henüz taranmış bir ürün yok" : "Aramanla eşleşen bir tarama bulunamadı"}
            </Text>
            <Text style={styles.emptySub}>
              {history.length === 0
                ? "Bir ürün taradığında burada arayabileceksin."
                : "Aradığın ürünü daha önce taramadıysan, yeni bir tarama yapman gerekiyor."}
            </Text>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.ctaCard} onPress={() => navigation.navigate("Scan")} activeOpacity={0.85}>
            <View style={styles.ctaIconWrap}>
              <CameraIcon size={16} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>Aramada bulamadın mı?</Text>
              <Text style={styles.ctaSub}>Etiketini çek, veritabanında olmayan ürünü de analiz et</Text>
            </View>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 42,
    ...shadows.card,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 13.5, fontFamily: fontFamily.regular },
  resultCount: { color: colors.textFaint, fontSize: 11, fontFamily: fontFamily.semibold, paddingHorizontal: spacing.lg, marginBottom: spacing.xs },
  listContainer: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xl * 3 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  itemImage: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.surface },
  itemTitle: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold },
  itemMeta: { color: colors.textFaint, fontSize: 10.5, marginTop: 2 },
  scoreBadge: { width: 34, height: 26, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  scoreBadgeText: { color: "#fff", fontSize: 12, fontFamily: fontFamily.semibold },

  emptyBox: { alignItems: "center", paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 14, fontFamily: fontFamily.semibold, textAlign: "center", marginBottom: 6 },
  emptySub: { color: colors.textMuted, fontSize: 12, textAlign: "center", lineHeight: 17 },

  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  ctaIconWrap: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  ctaTitle: { color: colors.text, fontSize: 12.5, fontFamily: fontFamily.semibold },
  ctaSub: { color: colors.textFaint, fontSize: 10.5, marginTop: 2 },
});
