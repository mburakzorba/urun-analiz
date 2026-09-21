import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows } from "../theme";
import { useHistory } from "../context/HistoryContext";
import { useUserProfile } from "../context/UserProfileContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useAuth } from "../context/AuthContext";
import { ChevronLeft, ChevronRight } from "../components/Icon";
import { ONBOARDING_KEY } from "./OnboardingScreen";
import { getTier, DEFAULT_TIER_ID } from "../utils/plans";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

// Tasarım kaynağı: "14 Ayarlar" ekranı (9 Eylül 2026). Her satırın GERÇEKTEN
// ne yaptığı aşağıda satır satır not edildi — bazıları gerçek/işlevsel
// (veri indir/sil, geçmişi temizle), bazıları henüz backend'i olmadığı için
// dürüstçe "yakında" diyor (giriş yap, ödeme yöntemleri, yasal metinler).
function handleComingSoon(title: string) {
  Alert.alert(title, "Bu özellik şu anda uygulamanın demo sürümünde aktif değil — yakında eklenecek.");
}

function Row({
  title,
  subtitle,
  onPress,
  last,
  danger,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  last?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.row, last && { borderBottomWidth: 0 }]} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.rowTitle, danger && { color: colors.danger }]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <ChevronRight size={14} color="rgba(32,30,29,0.3)" />
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const { history, clearHistory } = useHistory();
  const { profile, clearProfile } = useUserProfile();
  const { state } = useSubscription();
  const { user, signOut, deleteAccount } = useAuth();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleClearHistory = () => {
    if (history.length === 0) {
      Alert.alert("Geçmiş zaten boş", "Henüz kayıtlı bir tarama yok.");
      return;
    }
    Alert.alert(
      "Analiz geçmişini temizle",
      `${history.length} kayıtlı taramanın tamamı silinecek. Bu işlem geri alınamaz.`,
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Temizle", style: "destructive", onPress: () => clearHistory() },
      ]
    );
  };

  // "Verilerimi indir" — GERÇEK: cihazda tutulan profil + geçmiş verisini
  // (JSON) native paylaşım sayfası üzerinden dışa aktarıyor. Bir sunucuya
  // GÖNDERİLMİYOR, sadece cihazın kendi paylaş/kaydet seçeneklerini açıyor.
  const handleExportData = async () => {
    const payload = {
      profil: profile,
      abonelikDurumu: state,
      gecmis: history,
      olusturulmaTarihi: new Date().toISOString(),
    };
    try {
      await Share.share({
        message: JSON.stringify(payload, null, 2),
        title: "özünde - verilerim",
      });
    } catch {
      // Kullanıcı paylaşım sayfasını iptal etmiş olabilir — sessizce geç.
    }
  };

  // "Onboarding'i tekrar göster" — kullanıcı geri bildirimi: karşılama
  // ekranları sadece cihazda İLK KEZ açılışta (AsyncStorage'daki
  // ONBOARDING_KEY bayrağı yoksa) gösteriliyor; bir kez görüldükten sonra bir
  // daha karşına çıkmıyor. Bu satır GERÇEKTEN o bayrağı silip doğrudan
  // Onboarding'e atıyor — tekrar görmek için uygulamayı silip yeniden
  // kurmana gerek yok.
  const handleShowOnboarding = () => {
    Alert.alert(
      "Onboarding'i tekrar göster",
      "Karşılama ekranlarını (cilt tipi, alerjiler gibi sorularla) şimdi yeniden göreceksin.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Göster",
          onPress: async () => {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            navigation.reset({ index: 0, routes: [{ name: "Onboarding" }] });
          },
        },
      ]
    );
  };

  // 16 Eylül eklemesi: GERÇEK çıkış/hesap silme — bkz. context/AuthContext.tsx.
  const handleSignOut = () => {
    Alert.alert("Çıkış yap", "Hesabından çıkış yapmak istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış yap", style: "destructive", onPress: () => signOut() },
    ]);
  };

  // "Hesabımı sil" — Ayarlar'daki "Verilerimi sil"den (sadece cihazdaki
  // geçmiş/profili siler) FARKLI: bu, hesabının kendisini (e-posta/şifre
  // kaydını, Supabase'deki kullanıcıyı) KALICI olarak siler. Gerçek silme
  // işlemi backend'de (server/src/index.js > /account/delete) "service role"
  // anahtarıyla yapılıyor — bkz. AuthContext.tsx > deleteAccount.
  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabımı sil",
      "Hesabın kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istediğine emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Hesabımı sil",
          style: "destructive",
          onPress: async () => {
            setDeletingAccount(true);
            const result = await deleteAccount();
            setDeletingAccount(false);
            if (result.error) {
              Alert.alert("Hesap silinemedi", result.error);
              return;
            }
            Alert.alert("Hesabın silindi", "Hesabın kalıcı olarak silindi.");
          },
        },
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      "Verilerimi sil",
      "Profilin ve tüm analiz geçmişin cihazından silinecek. Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await clearHistory();
            await clearProfile();
            Alert.alert("Silindi", "Verilerin cihazından silindi.");
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
        <Text style={styles.title}>Ayarlar</Text>

        <Text style={styles.sectionLabel}>Hesap</Text>
        <View style={styles.card}>
          {/* 16 Eylül değişikliği: GERÇEK giriş durumu — bkz. dosya başındaki
              not. Not: hesap girişi şu an aboneliği/geçmişi cihazlar arası
              TAŞIMIYOR (bkz. AuthContext.tsx başındaki uzun not) — bu satırın
              alt yazısı bu yüzden artık o vaadi tekrarlamıyor. */}
          {user ? (
            <Row title="Hesabım" subtitle={user.email} onPress={handleSignOut} />
          ) : (
            <Row title="Giriş yap" subtitle="E-posta veya Google ile" onPress={() => navigation.navigate("Login")} />
          )}
          <Row
            title="Aboneliğim"
            subtitle={state.isPremium ? `Premium · ${getTier(state.tierId || DEFAULT_TIER_ID).name}` : "Ücretsiz plan · 3 ürün deneme"}
            onPress={() => navigation.navigate("Subscription")}
          />
          <Row title="Ödeme yöntemleri" onPress={() => handleComingSoon("Ödeme yöntemleri")} />
          <Row title="Verilerimi indir" onPress={handleExportData} />
          <Row title="Verilerimi sil" subtitle="Cihazdaki profil ve analiz geçmişi" onPress={handleDeleteData} last={!user} />
          {/* Sadece giriş yapılmışsa görünür — hesabı olmayan birinin
              "silecek" bir hesabı da yok. */}
          {user && (
            <Row
              title={deletingAccount ? "Hesap siliniyor..." : "Hesabımı sil"}
              subtitle="Hesabını kalıcı olarak siler"
              onPress={deletingAccount ? () => {} : handleDeleteAccount}
              danger
              last
            />
          )}
        </View>

        <Text style={styles.sectionLabel}>Uygulama</Text>
        <View style={styles.card}>
          <Row title="Dil" subtitle="Türkçe" onPress={() => handleComingSoon("Dil")} />
          <Row title="Bildirimler" onPress={() => navigation.navigate("Notifications")} />
          <Row title="Onboarding'i tekrar göster" subtitle="Karşılama ekranlarını yeniden gör" onPress={handleShowOnboarding} />
          <Row title="Analiz geçmişini temizle" onPress={handleClearHistory} last />
        </View>

        <Text style={styles.sectionLabel}>Yasal</Text>
        <View style={styles.card}>
          {/* 16 Eylül değişikliği: artık GERÇEK içerik gösteren ekranlara
              açılıyor (öncesinde ikisi de "yakında" diyordu). */}
          <Row title="Kullanım koşulları" onPress={() => navigation.navigate("Terms")} />
          <Row title="Gizlilik politikası" onPress={() => navigation.navigate("Privacy")} />
          <Row title="Sorun bildir" onPress={() => navigation.navigate("ReportProblem", undefined)} last />
        </View>

        <Text style={styles.version}>Sürüm 1.0.0</Text>
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
  sectionLabel: { fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: fontFamily.semibold, color: colors.textFaint, marginBottom: spacing.sm, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.card,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowTitle: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold },
  rowSubtitle: { color: colors.textFaint, fontSize: 10.5, marginTop: 2 },
  version: { color: colors.textFaint, fontSize: 10.5, textAlign: "center", marginTop: spacing.sm },
});
