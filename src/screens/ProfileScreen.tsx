import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MainTabScreenProps } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, accent as accentRamp, accent2 } from "../theme";
import { useSubscription } from "../context/SubscriptionContext";
import { useUserProfile } from "../context/UserProfileContext";
import { PLAN_INFO } from "../utils/plans";
import {
  ChevronRight,
  StarIcon,
  UserIcon,
  CreditCardIcon,
  BellIcon,
  SettingsIcon,
  AlertTriangleIcon,
  MailIcon,
} from "../components/Icon";

type Props = MainTabScreenProps<"Profile">;

// Tasarım kaynağı: "10 Profil" ekranı (9 Eylül 2026, kullanıcının Claude
// Design export'undan) — Profil sekmesinin YENİ hâli. Eskiden bu sekme
// doğrudan cilt/saç/alerji formunu (bkz. artık ProfileEditScreen.tsx, kök
// stack'teki "ProfileEdit") gösteriyordu; tasarımda bu bir MENÜ/HUB ekranı —
// abonelik durumu + hesap + ayarlar/bildirim/sorun-bildir kısayolları.
//
// "Hesabınla giriş yap" tasarımda var ama uygulamada gerçek bir e-posta/hesap
// sistemi (backend auth) YOK — bu yüzden dokununca sahte bir "giriş yapıldı"
// göstermek yerine dürüstçe "bu özellik henüz aktif değil" diyoruz (aşağıdaki
// handleComingSoon). Aynı mantık "Yeni kart ekle" gibi ödeme-yöntemi
// satırları için de geçerli (bkz. SubscriptionScreen/SettingsScreen).
function handleComingSoon(title: string) {
  Alert.alert(title, "Bu özellik şu anda uygulamanın demo sürümünde aktif değil — yakında eklenecek.");
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.menuRow, last && { borderBottomWidth: 0 }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconWrap}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.menuRowTitle, danger && { color: colors.danger }]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.menuRowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <ChevronRight size={15} color="rgba(32,30,29,0.3)" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { state, remainingFreeScans } = useSubscription();
  const { profile, isProfileEmpty } = useUserProfile();

  // 9 Eylül eklemesi: artık isim varsa avatar baş harfini ondan al (daha
  // kişisel) — yoksa eskisi gibi cilt tipinin baş harfine, o da yoksa "•"ya
  // düş. Ad/soyad varsa başlığın altında "Ahmet Yılmaz" gibi göster.
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const avatarInitial = profile.firstName
    ? profile.firstName.charAt(0).toUpperCase()
    : profile.skinType
    ? profile.skinType.charAt(0).toUpperCase()
    : "•";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <LinearGradient
            colors={[accent2[200], accent2[400]]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </LinearGradient>
          <View>
            <Text style={styles.title}>Profilim</Text>
            {!!fullName && <Text style={styles.nameSubtitle}>{fullName}</Text>}
          </View>
        </View>

        {/* Mevcut plan — gerçek SubscriptionContext durumu (tasarımdaki
            sabit "3 ürün deneme hakkının 1'ini kullandın" örneği değil,
            kullanıcının GERÇEK sayacı). */}
        <View style={styles.planCard}>
          <View style={styles.planHeaderRow}>
            <View style={[styles.planPill, state.isPremium && styles.planPillPremium]}>
              <Text style={[styles.planPillText, state.isPremium && styles.planPillTextPremium]}>
                {state.isPremium ? "Premium" : "Ücretsiz"}
              </Text>
            </View>
          </View>
          <Text style={styles.planNote}>
            {state.isPremium
              ? "Sınırsız analiz ve derin bileşen raporu açık."
              : `${state.freeScansLimit} ürün deneme hakkının ${
                  state.freeScansLimit - remainingFreeScans
                }'ini kullandın. Premium ile sınırsız analiz — ${PLAN_INFO.monthly.priceLabel}/ay'dan başlayan fiyatlarla.`}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(state.isPremium ? "Subscription" : "Paywall")}
            activeOpacity={0.85}
          >
            <View style={styles.planBtn}>
              <StarIcon size={13} color={colors.primaryDark} />
              <Text style={styles.planBtnText}>{state.isPremium ? "Aboneliğimi yönet" : "Premium'a geç"}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Hesabınla giriş yap — bkz. dosya başındaki not: gerçek bir hesap
            sistemi henüz yok, dokununca dürüstçe "yakında" mesajı çıkıyor. */}
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>Hesabınla giriş yap</Text>
          <Text style={styles.loginSub}>
            Zorunlu değil — profilin ve aboneliğin cihaz değiştirsen de seninle kalsın diye.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            activeOpacity={0.8}
            onPress={() => handleComingSoon("E-posta ile giriş yap")}
          >
            <MailIcon size={14} color={colors.text} />
            <Text style={styles.loginBtnText}>E-posta ile giriş yap</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuCard}>
          <MenuRow
            icon={<UserIcon size={16} color={colors.text} />}
            title="Profilim"
            subtitle={isProfileEmpty ? "Cilt / saç tipi, alerjiler, kişisel bilgiler" : "Cilt / saç tipi, alerjiler, kişisel bilgiler"}
            onPress={() => navigation.navigate("ProfileEdit")}
          />
          <MenuRow
            icon={<CreditCardIcon size={16} color={colors.text} />}
            title="Aboneliğim"
            subtitle={state.isPremium ? `Premium · ${PLAN_INFO[state.planInterval || "monthly"].label}` : "Ücretsiz plan · 3 ürün deneme"}
            onPress={() => navigation.navigate("Subscription")}
          />
          <MenuRow
            icon={<BellIcon size={16} color={colors.text} />}
            title="Bildirimler"
            onPress={() => navigation.navigate("Notifications")}
          />
          <MenuRow
            icon={<SettingsIcon size={16} color={colors.text} />}
            title="Ayarlar"
            subtitle="Dil, veri, yasal"
            onPress={() => navigation.navigate("Settings")}
          />
          <MenuRow
            icon={<AlertTriangleIcon size={16} color={colors.text} />}
            title="Sorun bildir"
            onPress={() => navigation.navigate("ReportProblem", undefined)}
            last
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontFamily: fontFamily.bold, color: accent2[800] },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.6, color: colors.text },
  nameSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 1 },

  planCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  planHeaderRow: { flexDirection: "row", marginBottom: 6 },
  planPill: { backgroundColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  planPillPremium: { backgroundColor: accentRamp[200] },
  planPillText: { fontSize: 10.5, fontFamily: fontFamily.bold, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.3 },
  planPillTextPremium: { color: accentRamp[700] },
  planNote: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: spacing.md },
  planBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "rgba(198,113,57,0.35)",
  },
  planBtnText: { color: colors.primaryDark, fontSize: 13, fontFamily: fontFamily.semibold },

  loginCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  loginTitle: { color: colors.text, fontSize: 14, fontFamily: fontFamily.semibold, marginBottom: 4 },
  loginSub: { color: colors.textFaint, fontSize: 11, lineHeight: 16, marginBottom: spacing.md },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loginBtnText: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold },

  menuCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.card,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  menuRowTitle: { color: colors.text, fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.1 },
  menuRowSubtitle: { color: colors.textFaint, fontSize: 10.5, marginTop: 2 },
});
