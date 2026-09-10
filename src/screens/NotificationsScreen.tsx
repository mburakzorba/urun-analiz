import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, accent as accentRamp } from "../theme";
import { ChevronLeft, BellIcon } from "../components/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

const PREFS_KEY = "urun-analiz:notificationPrefs";

interface NotificationPrefs {
  allergenAlerts: boolean;
  formulaChanges: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = { allergenAlerts: true, formulaChanges: true, marketing: false };

// Tasarımdaki "Bildirimin incelendi / Kaydettiğin bir ürün güncellendi /
// Deneme hakkın azalıyor" akışı GERÇEK bir bildirim geçmişi olmadığı için
// (backend'de push/bildirim sistemi yok) burada ÖRNEK olduğu açıkça
// belirtilen sabit içerik olarak kalıyor — ama alttaki tercih anahtarları
// (toggle'lar) GERÇEK, cihazda kalıcı (AsyncStorage) bir ayar.
const SAMPLE_FEED = [
  {
    title: "Bildirimin incelendi",
    body: "“Koruma ve Nem” ürününün bileşen listesi düzeltildi. Teşekkürler.",
    time: "2 saat önce",
  },
  {
    title: "Kaydettiğin bir ürün güncellendi",
    body: "Onarıcı Şampuan'ın formülü değişti; yeni etikette 2 alerjen var.",
    time: "Dün",
  },
  {
    title: "Deneme hakkın azalıyor",
    body: "Ücretsiz planda 1 analiz hakkın kaldı.",
    time: "3 gün önce",
  },
];

export default function NotificationsScreen({ navigation }: Props) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const updatePref = async (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
          <ChevronLeft size={15} color={colors.primaryDark} />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bildirimler</Text>

        <Text style={styles.sectionLabel}>Son bildirimler (örnek)</Text>
        <View style={styles.feedCard}>
          {SAMPLE_FEED.map((n, idx) => (
            <View key={n.title} style={[styles.feedRow, idx < SAMPLE_FEED.length - 1 && styles.feedRowDivider]}>
              <View style={styles.feedIconWrap}>
                <BellIcon size={14} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.feedTitle}>{n.title}</Text>
                <Text style={styles.feedBody}>{n.body}</Text>
                <Text style={styles.feedTime}>{n.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Bildirim tercihleri</Text>
        <View style={styles.prefsCard}>
          <PrefRow
            title="Alerjen uyarıları"
            subtitle="Profilindeki bileşen bir üründe geçerse"
            value={prefs.allergenAlerts}
            onChange={(v) => updatePref("allergenAlerts", v)}
            disabled={!loaded}
            last={false}
          />
          <PrefRow
            title="Formül değişiklikleri"
            subtitle="Analiz ettiğin ürünler güncellenirse"
            value={prefs.formulaChanges}
            onChange={(v) => updatePref("formulaChanges", v)}
            disabled={!loaded}
            last={false}
          />
          <PrefRow
            title="Kampanya ve duyurular"
            subtitle="Premium indirimleri"
            value={prefs.marketing}
            onChange={(v) => updatePref("marketing", v)}
            disabled={!loaded}
            last
          />
        </View>
        <Text style={styles.footnote}>
          Not: Bu tercihler cihazında kaydedilir. Uygulamanın gerçek anlık bildirim (push) altyapısı henüz kurulmadı —
          bu anahtarlar, o altyapı bağlandığında hangi bildirimlerin sana gönderileceğini belirleyecek.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrefRow({
  title,
  subtitle,
  value,
  onChange,
  disabled,
  last,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.prefRow, last && { borderBottomWidth: 0 }]}>
      <View style={{ flex: 1, marginRight: spacing.sm }}>
        <Text style={styles.prefTitle}>{title}</Text>
        <Text style={styles.prefSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: accentRamp[400] }}
        thumbColor={Platform.OS === "android" ? (value ? colors.primary : "#fff") : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.md },
  backText: { color: colors.primaryDark, fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.6, color: colors.text, marginBottom: spacing.lg },
  sectionLabel: { fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: fontFamily.semibold, color: colors.textFaint, marginBottom: spacing.sm, marginTop: spacing.sm },

  feedCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.card,
    marginBottom: spacing.md,
  },
  feedRow: { flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  feedRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  feedIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.cardAlt, alignItems: "center", justifyContent: "center" },
  feedTitle: { color: colors.text, fontSize: 12.5, fontFamily: fontFamily.semibold },
  feedBody: { color: colors.textMuted, fontSize: 11, marginTop: 2, lineHeight: 16 },
  feedTime: { color: colors.textFaint, fontSize: 10, marginTop: 4 },

  prefsCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  prefTitle: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold },
  prefSubtitle: { color: colors.textFaint, fontSize: 10.5, marginTop: 2 },
  footnote: { color: colors.textFaint, fontSize: 10.5, lineHeight: 15, marginTop: spacing.md },
});
