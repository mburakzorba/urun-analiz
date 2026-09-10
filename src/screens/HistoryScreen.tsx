import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MainTabScreenProps } from "../navigation/types";
import {
  colors,
  spacing,
  radius,
  fontFamily,
  shadows,
  primaryGradient,
  primaryGradientLocations,
  FLOATING_TAB_BAR_HEIGHT,
  good,
  warning,
  danger,
  accent as accentRamp,
} from "../theme";
import { useHistory } from "../context/HistoryContext";
import { useSubscription } from "../context/SubscriptionContext";
import { overallScore } from "../utils/verdict";
import { SearchIcon, CameraIcon } from "../components/Icon";

type Props = MainTabScreenProps<"History">;

// "Yeni → Eski": eklenme tarihine göre (varsayılan). "Sağlık Puanı": en
// güvenli/yüksek puanlı ürün en üstte. Liste büyüdükçe kullanıcı aradığını
// bulamıyordu — arama kutusu + bu sıralama seçeneği bunu çözüyor.
type SortMode = "date" | "health";

// Tasarım kaynağı ("08 Geçmiş" ekranındaki "Son taramaların" listesi): her
// satır, ürünün genel skoruna göre RENKLENDİRİLMİŞ bir zemine ve sol kenarlık
// rengine sahip (iyi→zeytin yeşili, orta→amber, riskli→kırmızı-kahve) — aynı
// eşikleri (70/45) utils/verdict.ts'teki tier() ile birebir kullanıyoruz ki
// aynı skor her ekranda aynı kategoriye düşsün.
function scoreTierColors(score: number) {
  if (score >= 70) return good;
  if (score >= 45) return warning;
  return danger;
}

export default function HistoryScreen({ navigation }: Props) {
  const { history, clearHistory } = useHistory();
  const { state } = useSubscription();
  const insets = useSafeAreaInsets();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("date");

  const visibleHistory = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const filtered = q
      ? history.filter((item) => {
          const haystack = `${item.productName} ${item.brand ?? ""} ${item.category ?? ""}`.toLocaleLowerCase(
            "tr-TR"
          );
          return haystack.includes(q);
        })
      : history;

    const sorted = [...filtered];
    if (sortMode === "health") {
      sorted.sort((a, b) => b.healthScore - a.healthScore);
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [history, query, sortMode]);

  // 9 Eylül düzeltmesi: eskiden "Temizle" hiçbir onay istemeden doğrudan
  // clearHistory() çağırıyordu — yanlış dokunuşla TÜM geçmiş sessizce
  // silinebiliyordu. Şimdi SettingsScreen'dekiyle aynı onay deseni kullanılıyor.
  const handleClearHistory = () => {
    Alert.alert(
      "Geçmişi temizle",
      `${history.length} kayıtlı taramanın tamamı silinecek. Bu işlem geri alınamaz.`,
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Temizle", style: "destructive", onPress: () => clearHistory() },
      ]
    );
  };

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
        <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Geçmiş Taramalar</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {history.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate("Search")} style={styles.headerIconBtn}>
              <SearchIcon size={15} color={colors.text} />
            </TouchableOpacity>
          )}
          {history.length > 0 ? (
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearBtn}>Temizle</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 8 }} />
          )}
        </View>
      </View>

      {history.length >= 2 && (
        <>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Ürün adı, marka veya kategori ara..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>

          <View style={styles.sortRow}>
            <TouchableOpacity
              style={[styles.sortChip, sortMode === "date" && styles.sortChipActive]}
              onPress={() => setSortMode("date")}
            >
              <Text style={[styles.sortChipText, sortMode === "date" && styles.sortChipTextActive]}>
                Yeni → Eski
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortChip, sortMode === "health" && styles.sortChipActive]}
              onPress={() => setSortMode("health")}
            >
              <Text style={[styles.sortChipText, sortMode === "health" && styles.sortChipTextActive]}>
                Sağlık Puanına Göre
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={toggleCompareMode} style={styles.compareToggle}>
            <Text style={styles.compareToggleText}>
              {compareMode ? "✕ Karşılaştırmayı İptal Et" : "⚖️ İki Ürünü Karşılaştır"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <FlatList
        data={visibleHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          history.length === 0 ? (
            // Tasarım kaynağı: "F Boş geçmiş" ekranı (9 Eylül 2026).
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <CameraIcon size={22} color={colors.primaryDark} />
              </View>
              <Text style={styles.emptyTitle}>Henüz analiz yok</Text>
              <Text style={styles.emptySub}>
                İlk ürününü tarayınca burada geçmişini ve karşılaştırmalarını göreceksin.
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Scan")} activeOpacity={0.9}>
                <View style={styles.emptyCta}>
                  <Text style={styles.emptyCtaText}>İlk ürününü tara</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.emptyText}>Aramanla eşleşen bir tarama bulunamadı.</Text>
          )
        }
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.id);
          // 7 Eylül düzeltmesi (skor kaynağı) + 9 Eylül düzeltmesi (renk
          // şeması): healthScore değil, diğer ekranlarla AYNI sayıyı temsil
          // eden overallScore'a göre, tasarımdaki gibi zemin/kenarlık/rozet
          // rengi hesaplanıyor.
          const tierColors = scoreTierColors(overallScore(item));
          return (
            <TouchableOpacity
              style={[
                styles.item,
                { backgroundColor: tierColors.bg, borderLeftColor: tierColors.border },
                compareMode && selected && styles.itemSelected,
              ]}
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
                <Text style={[styles.itemTitle, { color: tierColors.text }]} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={[styles.itemDate, { color: tierColors.text, opacity: 0.62 }]}>
                  {new Date(item.createdAt).toLocaleString("tr-TR")}
                </Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: tierColors.solid }]}>
                <Text style={styles.scoreBadgeText}>{overallScore(item)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {compareMode && (
        <View style={[styles.bottomBar, { bottom: insets.bottom + FLOATING_TAB_BAR_HEIGHT }]}>
          <TouchableOpacity onPress={handleCompare} disabled={selectedIds.length !== 2} activeOpacity={0.9}>
            {selectedIds.length === 2 ? (
              <LinearGradient
                colors={primaryGradient}
                locations={primaryGradientLocations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.compareBtn}
              >
                <Text style={styles.compareBtnText}>Karşılaştır ({selectedIds.length}/2)</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.compareBtn, styles.compareBtnDisabled]}>
                <Text style={[styles.compareBtnText, styles.compareBtnTextDisabled]}>
                  Karşılaştır ({selectedIds.length}/2)
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Tasarım kaynağı: "08 Geçmiş — karşılaştır" ekranı — renk/tipografi
// belirteçleri (8 Eylül 2026, kullanıcının Claude Design export'undan)
// birebir aktarıldı. NOT: bu ekranın altındaki arama/sıralama/karşılaştırma
// seçme akışı, tasarımdaki segmentli sekme (Analizlerim/Karşılaştır) yapısından
// FARKLI — mevcut işlevsellik bilinçli olarak korundu, sadece renk/font
// tutarlılığı sağlandı (eski, temayla ilgisiz "neon yeşil" rgba(74,222,128,*)
// vurguları accentRamp[100] gibi sıcak palet tonlarıyla değiştirildi).
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: { color: accentRamp[600], fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  title: { color: colors.text, fontSize: 16, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  clearBtn: { color: danger.text, fontSize: 13, fontFamily: fontFamily.regular },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  compareToggle: {
    alignSelf: "center",
    backgroundColor: colors.cardAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  compareToggleText: { color: accentRamp[600], fontSize: 13, fontFamily: fontFamily.semibold },
  searchRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  searchInput: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  sortRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sortChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.cardAlt,
  },
  sortChipActive: { backgroundColor: accentRamp[100] },
  sortChipText: { color: colors.textMuted, fontSize: 11, fontFamily: fontFamily.semibold },
  sortChipTextActive: { color: accentRamp[600] },
  listContainer: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xl * 3 },
  emptyText: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
  emptyBox: { alignItems: "center", paddingTop: spacing.xl * 1.5, paddingHorizontal: spacing.lg },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: 15.5, fontFamily: fontFamily.semibold, marginBottom: 6 },
  emptySub: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: spacing.lg },
  emptyCta: {
    height: 44,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow(colors.primaryDark),
  },
  emptyCtaText: { color: "#fff", fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  // Zemin/kenarlık rengi artık JSX'te ürünün skor kademesine göre (bkz.
  // scoreTierColors) inline set ediliyor — burada sadece ortak yerleşim.
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderLeftWidth: 4,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  // Karşılaştırma modunda seçili satır: zemin rengi (skor kademesi) korunuyor,
  // sadece etrafına bir seçim halkası ekleniyor.
  itemSelected: { borderWidth: 1.5, borderColor: colors.primary },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkboxTick: { color: "#fff", fontSize: 13, fontFamily: fontFamily.bold },
  itemImage: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: "#fff" },
  itemTitle: { fontSize: 13, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  itemDate: { fontSize: 11, marginTop: 2 },
  // Rozet artık tasarımdaki gibi DOLU (solid) renkli zemin + beyaz yazı —
  // rengi JSX'te skor kademesine göre inline set ediliyor.
  scoreBadge: {
    minWidth: 38,
    height: 29,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  scoreBadgeText: { color: "#fff", fontFamily: fontFamily.semibold, fontSize: 13 },
  bottomBar: {
    // `bottom` değeri artık statik değil — YÜZEN sekme çubuğunun altında
    // kalmaması için JSX'te insets.bottom + FLOATING_TAB_BAR_HEIGHT olarak
    // inline set ediliyor (bkz. render metodu).
    position: "absolute",
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  compareBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  compareBtnDisabled: { backgroundColor: colors.cardAlt },
  compareBtnText: { color: "#fff", fontFamily: fontFamily.semibold, fontSize: 14.5, letterSpacing: -0.2 },
  // Devre dışıyken zemin açık renk (cardAlt) — beyaz yazı okunmaz hale
  // geliyordu, bu yüzden bu durumda koyu/soluk bir renk kullanıyoruz.
  compareBtnTextDisabled: { color: colors.textFaint },
});
