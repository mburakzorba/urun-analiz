import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, good } from "../theme";
import { MailIcon } from "../components/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "ReportSent">;

// Tasarım kaynağı: "K Bildirim gönderildi" ekranı.
//
// 9 Eylül düzeltmesi (2. tur): ReportProblemScreen artık GERÇEKTEN otomatik
// gönderebiliyor (backend/Resend üzerinden) — bu durumda (autoSent=true)
// tasarımdaki gibi kendinden emin "bildirimin bize ulaştı" diyebiliriz,
// çünkü bu artık DOĞRU. Backend kurulmadıysa ya da otomatik gönderim başarısız
// olup eski mailto: yedeğine düşüldüyse (autoSent=false), önceki (1. tur)
// dürüst "mail hazır, göndermeyi unutma" metnini gösteriyoruz.
export default function ReportSentScreen({ route, navigation }: Props) {
  const autoSent = route.params?.autoSent ?? true;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBadge}>
          <MailIcon size={26} color="#fff" />
        </View>
        <Text style={styles.title}>{autoSent ? "Bildirimin gönderildi" : "Mailin hazırlandı"}</Text>
        <Text style={styles.subtitle}>
          {autoSent
            ? "Bildirimin otomatik olarak bize e-posta ile ulaştı. Genellikle 48 saat içinde inceleyip gerekirse sana geri döneriz."
            : "Mail uygulaman bildirimin içeriğiyle açıldı. Göndermeyi unutma — gönderdikten sonra genellikle 48 saat içinde inceleyip sonucu sana bildiririz."}
        </Text>
        <TouchableOpacity onPress={() => navigation.popToTop()} activeOpacity={0.9} style={{ width: "100%" }}>
          <View style={styles.mainBtn}>
            <Text style={styles.mainBtnText}>Tamam</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: good.solid,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    ...shadows.lifted(good.solid),
  },
  title: { fontFamily: fontFamily.semibold, fontSize: 20, letterSpacing: -0.5, color: colors.text, marginBottom: 6 },
  subtitle: { color: colors.textMuted, fontSize: 12.5, lineHeight: 19, textAlign: "center", marginBottom: spacing.xl, paddingHorizontal: spacing.sm },
  mainBtn: {
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow(colors.primaryDark),
  },
  mainBtnText: { color: "#fff", fontSize: 14.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
});
