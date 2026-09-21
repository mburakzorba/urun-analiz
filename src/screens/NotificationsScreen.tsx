import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, accent as accentRamp } from "../theme";
import { ChevronLeft, BellIcon } from "../components/Icon";
import { NotificationPrefs, DEFAULT_NOTIFICATION_PREFS, getNotificationPrefs, saveNotificationPrefs, getNextReminderDate } from "../services/notifications";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

// 16 Eylül değişikliği: burada eskiden "Bildirimin incelendi / Kaydettiğin
// bir ürün güncellendi / Deneme hakkın azalıyor" gibi SAHTE/örnek bir
// bildirim akışı vardı — hiçbir zaman gerçek olmadı. Kullanıcı haklı olarak
// bunun artık çalışan gerçek hatırlatma sistemiyle alakasız olduğunu
// belirtti; sahte feed tamamen kaldırıldı. Yerine, GERÇEKTEN planlanmış bir
// sonraki hatırlatmanın tarihini gösteren bir durum kartı kondu.
//
// 18 Eylül değişikliği: "Hatırlatmalar" için ayrı bir açma/kapama anahtarı
// KALDIRILDI — kullanıcı geri bildirimi: telefonun kendi bildirim izni
// zaten bunun aç/kapa kontrolü, ayrıca bir anahtara gerek yok. Hatırlatmalar
// artık tamamen otomatik: uygulama açıldığında (bkz. HomeScreen.tsx >
// ensureRemindersScheduled) bildirim izni sessizce istenir, izin verilirse
// hatırlatmalar kendiliğinden planlanır. Bu ekran sadece o otomatik durumu
// GÖSTERİR — burada bir şey açıp kapatmıyorsun.
function formatReminderDate(date: Date): string {
  const dayName = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(date);
  const dayMonth = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(date);
  const time = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${dayName}, ${dayMonth} · ${time}`;
}

export default function NotificationsScreen({ navigation }: Props) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [loaded, setLoaded] = useState(false);
  const [nextReminder, setNextReminder] = useState<Date | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const [p, next] = await Promise.all([getNotificationPrefs(), getNextReminderDate()]);
      setPrefs(p);
      setNextReminder(next);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Ekran her odaklandığında (ör. Ayarlar'dan tekrar buraya girince) durumu
  // tazeler — HomeScreen'in az önce bildirim izni isteyip hatırlatma
  // planlamış olabileceği ihtimaline karşı, sadece mount'ta değil her
  // görünür olduğunda okunuyor.
  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus])
  );

  const updatePref = async (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await saveNotificationPrefs(next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
          <ChevronLeft size={15} color={colors.primaryDark} />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bildirimler</Text>

        <Text style={styles.sectionLabel}>Hatırlatma durumu</Text>
        <View style={styles.feedCard}>
          <View style={styles.feedRow}>
            <View style={styles.feedIconWrap}>
              <BellIcon size={14} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              {nextReminder ? (
                <>
                  <Text style={styles.feedTitle}>Sıradaki hatırlatma planlandı</Text>
                  <Text style={styles.feedBody}>{formatReminderDate(nextReminder)}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.feedTitle}>Henüz hatırlatma planlanmadı</Text>
                  <Text style={styles.feedBody}>
                    Telefonunun bildirim izni açıldığında tarama hatırlatmaları (haftada 2 kez) kendiliğinden
                    başlar — ekstra bir şey yapmana gerek yok.
                  </Text>
                </>
              )}
            </View>
          </View>
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
          Bu üç tercih, ileride sana hangi bildirimlerin gönderileceğini belirleyecek — istediğin zaman buradan
          değiştirebilirsin. Tarama hatırlatmalarını tamamen kapatmak istersen telefonunun Ayarlar {"›"} Bildirimler
          bölümünden özünde'nin bildirim iznini kapatman yeterli.
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
  feedIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.cardAlt, alignItems: "center", justifyContent: "center" },
  feedTitle: { color: colors.text, fontSize: 12.5, fontFamily: fontFamily.semibold },
  feedBody: { color: colors.textMuted, fontSize: 11, marginTop: 2, lineHeight: 16 },

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
