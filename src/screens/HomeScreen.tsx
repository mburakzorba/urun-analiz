import React, { useMemo, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MainTabScreenProps } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, accent2, vividStat, FLOATING_TAB_BAR_HEIGHT } from "../theme";
import ProductThumb from "../components/ProductThumb";
import { useSubscription } from "../context/SubscriptionContext";
import { useHistory } from "../context/HistoryContext";
import { useUserProfile } from "../context/UserProfileContext";
import { shortHealthVerdict, overallScore } from "../utils/verdict";
import { StarIcon, CameraIcon, HistoryIcon, ChevronRight } from "../components/Icon";
import { ensureRemindersScheduled } from "../services/notifications";

type Props = MainTabScreenProps<"Home">;

// Risk/skor rozetlerinin dolgu rengi — pastel dolgu (bkz. tasarım:
// https://claude.ai/design/p/ef7e6ff5-08a5-43c8-8785-ff498f1fac1c).
function withOpacity(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function HomeScreen({ navigation }: Props) {
  const { state, canScan, totalRemainingScans } = useSubscription();
  const { history } = useHistory();
  const { profile, isProfileEmpty } = useUserProfile();
  // 22 Eylül düzeltmesi (kullanıcı geri bildirimi — "iki ürünü karşılaştır
  // kısmı bar ile üst üste denk geliyor"): Profil sekmesinde 11 Eylül'de
  // aynı sebeple düzeltilen sorunun aynısı — bu ekran de YÜZEN (position:
  // absolute) sekme çubuğunun ÜSTÜNDE, ama sabit paddingBottom çubuğun
  // gerçek yüksekliğini (FLOATING_TAB_BAR_HEIGHT + insets.bottom) hesaba
  // katmıyordu, son kart (compareCard) çubuğun arkasında kalabiliyordu.
  const insets = useSafeAreaInsets();

  // 18 Eylül değişikliği: eskiden hatırlatma izni SADECE Bildirimler
  // ekranındaki bir anahtara basılınca isteniyordu. Kullanıcı geri bildirimi
  // üzerine o anahtar kaldırıldı — artık bildirim izni burada, Ana Sayfa
  // (uygulama açılınca ilk görülen sekme) ilk yüklendiğinde SESSİZCE
  // isteniyor; izin verilirse hatırlatmalar hemen, otomatik planlanıyor.
  // İzin zaten sorulmuş/reddedilmişse (canAskAgain=false) tekrar sormaz.
  // canScan değiştiğinde (ör. paket bitti/ek paket alındı) de tazeler ki
  // bir dahaki hatırlatma doğru mesaj havuzunu kullansın.
  useEffect(() => {
    ensureRemindersScheduled(canScan);
  }, [canScan]);

  // "Faydalı / Dikkat / Riskli" — tüm geçmiş taramalardaki bileşenlerin risk
  // dağılımı toplamı (tasarımdaki 01 Ana sayfa'da 42/9/4 örneği ile aynı
  // konsept: kullanıcının şimdiye kadar taradığı ürünlerdeki bileşen
  // karışımına dair genel bir özet).
  const ingredientTotals = useMemo(() => {
    let good = 0;
    let mid = 0;
    let risky = 0;
    for (const item of history) {
      for (const ing of item.ingredients) {
        if (ing.risk === "iyi") good++;
        else if (ing.risk === "orta") mid++;
        else risky++;
      }
    }
    return { good, mid, risky };
  }, [history]);

  const handleScanPress = () => {
    if (canScan) {
      navigation.navigate("Scan");
    } else {
      // 9 Eylül düzeltmesi: eskiden bu buton (canScan false olunca) tamamen
      // DEVRE DIŞI bırakılıyordu (disabled={!canScan} — bkz. JSX), yani
      // tasarımdaki "L Limit doldu" ekranına hiç ulaşılamıyordu. Artık buton
      // her zaman aktif; hak bittiğinde bu özel ekrana yönlendiriyor.
      //
      // 12 Eylül değişikliği: eskiden burada, Premium kullanıcı "âdil
      // kullanım" sınırını aşınca AYRI bir Alert gösteriliyordu (paket kotası
      // kavramı yoktu, tek bir "sınırsız + 300 âdil kullanım" planı vardı).
      // Artık her paketin kendi net kotası var, ve kota dolunca kullanıcının
      // önünde GERÇEK seçenekler var (daha büyük pakete geç / ek tarama
      // paketi al) — bunları LimitReachedScreen zaten (isPremium'a göre)
      // doğru şekilde gösteriyor, o yüzden ayrı bir Alert'e gerek kalmadı.
      navigation.navigate("LimitReached");
    }
  };

  // 9 Eylül eklemesi: isim varsa avatar baş harfi ve "Merhaba" selamlaması
  // artık ona göre kişisel ("Merhaba, Ahmet") — yoksa eskisi gibi cilt
  // tipinin baş harfine ve düz "Merhaba"ya düşüyor.
  const skinInitial = profile.firstName
    ? profile.firstName.charAt(0).toUpperCase()
    : profile.skinType
    ? profile.skinType.charAt(0).toUpperCase()
    : "•";
  const greeting = profile.firstName ? `Merhaba, ${profile.firstName}` : "Merhaba";
  const subtitle = isProfileEmpty
    ? "Profilini tamamla, sana özel değerlendirme al"
    : [profile.skinType ? `${profile.skinType} cilt` : null, profile.allergies[0] ? `${profile.allergies[0]} hassasiyeti` : null]
        .filter(Boolean)
        .join(" · ") || "Profilin hazır";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: FLOATING_TAB_BAR_HEIGHT + insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub} numberOfLines={1}>{subtitle}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{greeting}</Text>
          </View>
          {/* 9 Eylül düzeltmesi (kullanıcı geri bildirimi): Ana Sayfa'nın en
              üstündeki arama butonu kaldırıldı — sade kalsın istendi. Arama
              (Search ekranı) hâlâ var, sadece giriş noktası artık burada
              değil: Geçmiş sekmesindeki büyüteç ikonundan açılıyor. */}
          <TouchableOpacity onPress={() => navigation.navigate("Profile")} activeOpacity={0.8}>
            <LinearGradient
              colors={[accent2[200], accent2[400]]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{skinInitial}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {!state.isPremium && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("Paywall")}>
            <LinearGradient
              colors={["#2F2A26", "#4A342A", colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumBanner}
            >
              <View style={styles.premiumIconWrap}>
                <StarIcon size={18} color="#F0C79A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>Premium'a geç</Text>
                {/* 13 Eylül düzeltmesi (kullanıcı geri bildirimi — "ek paket
                    almasına rağmen ana sayfada ücretsiz 3 tane hak kaldı
                    diyor"): burada eskiden SADECE remainingFreeScans
                    gösteriliyordu — ek tarama paketi satın alınca bakiye
                    değişse bile bu metin hep aynı (yanlış) sayıyı
                    gösteriyordu. totalRemainingScans, ücretsiz kota + ek
                    tarama bakiyesini toplayarak kullanıcının GERÇEKTEN kaç
                    tarama hakkı kaldığını gösterir. */}
                <Text style={styles.premiumSub}>Ücretsiz plan · {totalRemainingScans} hak kaldı</Text>
              </View>
              <ChevronRight size={16} color="rgba(255,253,249,0.5)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <LinearGradient
          colors={["#FFF2EB", "#FFE1D0"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroKicker}>Yeni analiz</Text>
          <Text style={styles.heroHeadline}>Kullandığın ürünlerin içinde ne var? Etiketi çek, sana uygun mu öğren.</Text>
          <TouchableOpacity onPress={handleScanPress} activeOpacity={0.85}>
            {/* NOT (6 Eylül düzeltmesi): tasarım kaynağında (01_Ana_sayfa.html)
                bu buton GRADYAN DEĞİL, düz #C67139 (colors.primary) —
                gradyan yalnızca "Kaydet/İzin ver/Premium'a geç" gibi diğer
                CTA'larda kullanılıyor. Önceki turda yanlışlıkla buraya da
                gradyan uygulanmıştı; bu da butonun sağ tarafının koyu/soluk
                görünmesine (kullanıcı geri bildirimi) yol açıyordu.
                NOT (9 Eylül düzeltmesi): "disabled={!canScan}" kaldırıldı —
                buton artık hak bittiğinde de tıklanabilir kalıyor (görsel
                olarak "soluk" görünse de), çünkü handleScanPress artık bu
                durumda LimitReached ekranına yönlendiriyor; disabled kalsaydı
                o ekrana hiç ulaşılamazdı. */}
            <View style={[styles.heroBtn, canScan ? styles.heroBtnEnabled : styles.heroBtnDisabled]}>
              <CameraIcon size={17} color="#fff" />
              <Text style={styles.heroBtnText}>
                {canScan ? "Analiz et" : "Tarama Hakkın Doldu"}
              </Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: vividStat.good }]}>{ingredientTotals.good}</Text>
            <Text style={styles.statLabel}>faydalı</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primaryDark }]}>{ingredientTotals.mid}</Text>
            <Text style={styles.statLabel}>dikkat</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: vividStat.risky }]}>{ingredientTotals.risky}</Text>
            <Text style={styles.statLabel}>riskli</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Son analizler</Text>
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
            renderItem={({ item }) => {
              // 7 Eylül düzeltmesi: burada da healthScore değil, Sonuç
              // ekranındaki büyük halkayla AYNI sayı (overallScore)
              // gösteriliyor — aksi halde aynı ürün için iki ekranda iki
              // farklı puan görünüyordu (kullanıcı geri bildirimi).
              const itemScore = overallScore(item);
              const verdict = shortHealthVerdict(itemScore);
              return (
                <TouchableOpacity
                  style={styles.historyItem}
                  onPress={() => navigation.navigate("Result", { analysis: item })}
                  activeOpacity={0.85}
                >
                  <ProductThumb category={item.category} productName={item.productName} size={42} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.historyItemTitle} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.historyItemDate} numberOfLines={1}>
                      {(item.category ? item.category + " · " : "") + new Date(item.createdAt).toLocaleDateString("tr-TR")}
                    </Text>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: withOpacity(verdict.color, 0.15) }]}>
                    <Text style={[styles.scoreBadgeText, { color: verdict.color }]}>{itemScore}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        <TouchableOpacity style={styles.compareCard} onPress={() => navigation.navigate("History")} activeOpacity={0.85}>
          <View style={styles.compareIconWrap}>
            <HistoryIcon size={18} color={accent2[700]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.compareTitle}>İki ürünü yan yana koy</Text>
            <Text style={styles.compareSub}>Geçmiş sekmesindeki Karşılaştır'dan başla</Text>
          </View>
          <ChevronRight size={16} color="rgba(32,30,29,0.3)" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg },
  headerSub: { color: colors.text, fontSize: 13, fontFamily: fontFamily.regular },
  headerTitle: { fontSize: 25, fontFamily: fontFamily.bold, letterSpacing: -0.7, color: colors.text, marginTop: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13, fontFamily: fontFamily.bold, color: accent2[800] },

  premiumBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.lg,
    padding: 15,
    marginBottom: spacing.md,
    ...shadows.lifted("#2E2B25"),
  },
  premiumIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,253,249,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumTitle: { color: "#FFFDF9", fontSize: 13, fontFamily: fontFamily.semibold, letterSpacing: -0.02 },
  premiumSub: { color: "rgba(255,253,249,0.62)", fontSize: 10.5, fontFamily: fontFamily.regular, marginTop: 3 },

  heroCard: { borderRadius: radius.lg, padding: 20, marginBottom: spacing.md },
  heroKicker: { fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", fontFamily: fontFamily.bold, color: colors.primaryDark, marginBottom: 9 },
  heroHeadline: { fontSize: 16.5, fontFamily: fontFamily.semibold, letterSpacing: -0.4, lineHeight: 22, color: colors.primaryDarker, marginBottom: 14 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: radius.pill,
    ...shadows.glow(colors.primaryDark),
  },
  heroBtnEnabled: { backgroundColor: colors.primary },
  heroBtnDisabled: { backgroundColor: colors.border },
  heroBtnText: { color: "#fff", fontSize: 14, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },

  statRow: { flexDirection: "row", gap: 8, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 13, ...shadows.card, borderWidth: 1, borderColor: colors.hairline },
  statValue: { fontSize: 19, fontFamily: fontFamily.bold, letterSpacing: -0.8, lineHeight: 22 },
  statLabel: { color: colors.textMuted, fontSize: 10.5, fontFamily: fontFamily.regular, marginTop: 3 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: spacing.sm },
  sectionTitle: { fontSize: 15, fontFamily: fontFamily.semibold, color: colors.text },
  link: { color: colors.primary, fontSize: 13, fontFamily: fontFamily.semibold },
  emptyText: { color: colors.textMuted, fontSize: 14 },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 11,
    marginBottom: 8,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  historyItemTitle: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold, letterSpacing: -0.02 },
  historyItemDate: { color: colors.textMuted, fontSize: 10.5, fontFamily: fontFamily.regular, marginTop: 3 },
  scoreBadge: { width: 38, height: 29, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  scoreBadgeText: { fontSize: 13, fontFamily: fontFamily.bold },

  compareCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 4,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  compareIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: accent2[100], alignItems: "center", justifyContent: "center" },
  compareTitle: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold },
  compareSub: { color: colors.textMuted, fontSize: 10.5, marginTop: 2 },
});
