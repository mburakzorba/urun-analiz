import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, accent as accentRamp, danger } from "../theme";
import { useSubscription } from "../context/SubscriptionContext";
import { ChevronLeft, StarIcon, CreditCardIcon, FlashIcon, PlusIcon } from "../components/Icon";
import { getTier, DEFAULT_TIER_ID, ADDON, addOneMonth } from "../utils/plans";

type Props = NativeStackScreenProps<RootStackParamList, "Subscription">;

function formatRenewalDate(periodStartISO: string): string {
  const next = addOneMonth(periodStartISO);
  return next.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

// Tasarım kaynağı: "J Aboneliğim" ekranı (9 Eylül 2026). NOT: tasarımda
// gösterilen "•••• 4821" gibi kayıtlı bir kart, uygulamanın GERÇEK abonelik
// altyapısında (SubscriptionContext) yok — activatePremium() yerel bir demo
// bayrağı, kartla ilgili hiçbir bilgi tutulmuyor. Sahte bir kart numarası
// göstermek yanlış olur, o yüzden burada SADECE gerçekten var olan bilgiyi
// (paket/fiyat/kota kullanımı/yenileme tarihi, hesaplanmış) gösteriyoruz;
// "Ödeme yöntemi" satırı tasarımdaki gibi duruyor ama dokununca dürüstçe
// "yakında" diyor. "Aboneliği iptal et" ve "Paketi değiştir" ise GERÇEK.
//
// 12 Eylül değişikliği: tek "Premium" planı yerine dört paket var (bkz.
// plans.ts > TIERS) — "Yıllık plana geç" satırı bu yüzden kaldırıldı (henüz
// yıllık seçenek yok, bkz. plans.ts başındaki not). Yerine paket kotası
// kullanım durumu ve "Paketi değiştir" / "Ek tarama paketi al" eklendi.
// 13 Eylül eklemesi: paketin aylık kota barına ek olarak, tek seferlik ek
// tarama paketi (bonusScans) bakiyesi için de aynı görsel dilde bir bar —
// kullanıcı bunu "abonelik hakkı" bölümünün altında görsün istendi. bonusScans
// aya bağlı sıfırlanmadığından, kullanım oranını bonusScansTotal'a (bugüne
// kadar satın alınan toplam) göre hesaplıyoruz; hiç alınmamışsa gösterilmez.
function BonusScansBar({ bonusScans, bonusScansTotal }: { bonusScans: number; bonusScansTotal: number }) {
  if (bonusScansTotal <= 0) return null;
  const usedRatio = Math.min(100, ((bonusScansTotal - bonusScans) / bonusScansTotal) * 100);
  return (
    <View style={styles.quotaBlock}>
      <View style={styles.quotaHeaderRow}>
        <Text style={styles.quotaLabel}>Ek tarama paketi</Text>
        <Text style={styles.quotaValue}>{bonusScans} tarama kaldı</Text>
      </View>
      <View style={styles.quotaBarTrack}>
        <View style={[styles.quotaBarFill, styles.quotaBarFillBonus, { width: `${usedRatio}%` }]} />
      </View>
    </View>
  );
}

export default function SubscriptionScreen({ navigation }: Props) {
  const { state, cancelPremium, remainingTierScans } = useSubscription();
  const tier = getTier(state.tierId || DEFAULT_TIER_ID);

  const handleComingSoon = (title: string) =>
    Alert.alert(title, "Bu özellik şu anda uygulamanın demo sürümünde aktif değil — yakında eklenecek.");

  // 21 Eylül değişikliği (RevenueCat entegrasyonu): Google Play Billing'de
  // abonelik iptali UYGULAMA İÇİNDEN yapılamaz — kullanıcı Google Play'in
  // kendi abonelik yönetimi sayfasına yönlendiriliyor, iptal orada
  // onaylanıyor. Bu yüzden burada artık "iptal edildi" diye anında bir
  // sonuç göstermiyoruz; kullanım hakkı da dönem sonuna kadar devam eder
  // (Google Play'in standart davranışı).
  const handleCancel = () => {
    Alert.alert(
      "Aboneliği iptal et",
      "İptal işlemi Google Play üzerinden yapılır — şimdi Play Store'un abonelik yönetimi sayfasına yönlendirileceksin. Mevcut dönem sonuna kadar Premium hakların devam eder.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Play Store'a Git",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelPremium();
            } catch (err) {
              console.warn("[SubscriptionScreen] Play Store'a yönlendirilemedi:", err);
              Alert.alert("Bir sorun oluştu", "Play Store'a yönlendirilemedi, lütfen tekrar dene.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
          <ChevronLeft size={15} color={colors.primaryDark} />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Aboneliğim</Text>

        {state.isPremium ? (
          <>
            <View style={styles.planCard}>
              <Text style={styles.sectionLabel}>Mevcut plan</Text>
              <View style={styles.planRow}>
                <View style={styles.planIconWrap}>
                  <StarIcon size={16} color={colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>Premium · {tier.name}</Text>
                  <Text style={styles.planSub}>
                    {tier.priceLabel} / ay · {formatRenewalDate(state.currentPeriodStart)}'da yenilenir
                  </Text>
                </View>
              </View>

              {/* 12 Eylül eklemesi: paketin bu ayki kota kullanımı — kaç
                  taramanın kaldığını net gösteren bir mini bar. */}
              <View style={styles.quotaBlock}>
                <View style={styles.quotaHeaderRow}>
                  <Text style={styles.quotaLabel}>Bu ay kullanılan</Text>
                  <Text style={styles.quotaValue}>
                    {tier.scansPerMonth - remainingTierScans} / {tier.scansPerMonth} tarama
                  </Text>
                </View>
                <View style={styles.quotaBarTrack}>
                  <View
                    style={[
                      styles.quotaBarFill,
                      { width: `${Math.min(100, ((tier.scansPerMonth - remainingTierScans) / tier.scansPerMonth) * 100)}%` },
                    ]}
                  />
                </View>
              </View>

              <BonusScansBar bonusScans={state.bonusScans} bonusScansTotal={state.bonusScansTotal} />

              <TouchableOpacity
                style={[styles.row, { borderBottomWidth: 0, paddingTop: spacing.md }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Paywall")}
              >
                <FlashIcon size={16} color={colors.text} />
                <Text style={styles.rowText}>Paketi değiştir</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addonCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("Payment", { kind: "addon" })}
            >
              <View style={styles.planIconWrap}>
                <PlusIcon size={16} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowText}>{ADDON.name} al</Text>
                <Text style={styles.addonCardSub}>
                  {ADDON.priceLabel} · {ADDON.extraScans} ek tarama · tek seferlik, kotan bitince de kullanılır
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.planCard}>
              <Text style={styles.sectionLabel}>Ödeme yöntemi</Text>
              <TouchableOpacity
                style={[styles.row, { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => handleComingSoon("Ödeme yöntemi")}
              >
                <CreditCardIcon size={16} color={colors.text} />
                <Text style={styles.rowText}>Ödeme yöntemini güncelle</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => handleComingSoon("Makbuzlar")}
            >
              <Text style={[styles.rowText, { marginLeft: 0 }]}>Makbuzlar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>Aboneliği iptal et</Text>
            </TouchableOpacity>
            <Text style={styles.cancelNote}>İptal edersen dönem sonuna kadar Premium açık kalır.</Text>
          </>
        ) : (
          <>
            <View style={styles.planCard}>
              <Text style={styles.sectionLabel}>Mevcut plan</Text>
              <View style={styles.planRow}>
                <View style={styles.planIconWrap}>
                  <StarIcon size={16} color={colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>Ücretsiz</Text>
                  <Text style={styles.planSub}>{state.freeScansLimit} ürün deneme hakkı / ay</Text>
                </View>
              </View>
              <BonusScansBar bonusScans={state.bonusScans} bonusScansTotal={state.bonusScansTotal} />
              <TouchableOpacity onPress={() => navigation.navigate("Paywall")} activeOpacity={0.9}>
                <View style={styles.upgradeBtn}>
                  <Text style={styles.upgradeBtnText}>Premium'a geç</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addonCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("Payment", { kind: "addon" })}
            >
              <View style={styles.planIconWrap}>
                <PlusIcon size={16} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowText}>{ADDON.name} al</Text>
                <Text style={styles.addonCardSub}>
                  Abone olmadan {ADDON.priceLabel} karşılığında {ADDON.extraScans} ek tarama
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.md },
  backText: { color: colors.primaryDark, fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.6, color: colors.text, marginBottom: spacing.lg },

  planCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionLabel: { fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: fontFamily.semibold, color: colors.textFaint, marginBottom: spacing.sm },
  planRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  planIconWrap: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  planTitle: { color: colors.text, fontSize: 14.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  planSub: { color: colors.textFaint, fontSize: 11, marginTop: 2 },

  quotaBlock: { marginTop: 10, marginBottom: 2 },
  quotaHeaderRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  quotaLabel: { color: colors.textMuted, fontSize: 11, fontFamily: fontFamily.semibold },
  quotaValue: { color: colors.text, fontSize: 11, fontFamily: fontFamily.semibold },
  quotaBarTrack: { height: 6, borderRadius: 999, backgroundColor: colors.border, overflow: "hidden" },
  quotaBarFill: { height: "100%", borderRadius: 999, backgroundColor: colors.primary },
  quotaBarFillBonus: { backgroundColor: colors.secondary },

  addonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  addonCardSub: { color: colors.textFaint, fontSize: 10.5, marginTop: 2 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowText: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold, marginLeft: 2 },

  upgradeBtn: {
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow(colors.primaryDark),
  },
  upgradeBtnText: { color: "#fff", fontSize: 14, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },

  cancelBtn: {
    marginTop: spacing.md,
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: danger.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { color: danger.text, fontSize: 13.5, fontFamily: fontFamily.semibold },
  cancelNote: { color: colors.textFaint, fontSize: 10.5, textAlign: "center", marginTop: spacing.sm, lineHeight: 15 },
});
