import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows } from "../theme";
import { ChevronLeft, CheckIcon, ImageOffIcon } from "../components/Icon";
import { sendProblemReport, isReportBackendConfigured } from "../services/reportProblem";

type Props = NativeStackScreenProps<RootStackParamList, "ReportProblem">;

// 10 Eylül düzeltmesi: eskiden burada "destek@ozunde.app" gibi hiç var
// olmayan/kayıtlı olmayan bir yer tutucu adres duruyordu — yedek yol devreye
// girdiğinde kullanıcı mailini oraya göndermeye çalışsaydı muhtemelen
// ulaşmayacaktı. Artık senin Render'da REPORT_EMAIL_TO olarak zaten
// kullandığın GERÇEK adresle aynı. Bu adres SADECE aşağıdaki YEDEK
// (fallback) yol için kullanılıyor — backend (RESEND_API_KEY/REPORT_EMAIL_TO,
// bkz. server/.env.example) tanımlı değilse ya da otomatik gönderim
// başarısız olursa, kullanıcının mail uygulamasını bu adres önceden
// doldurulmuş şekilde açıyoruz. Backend düzgün çalışıyorsa normal akışta bu
// adres HİÇ kullanılmıyor — bildirim doğrudan REPORT_EMAIL_TO'ya gidiyor.
const SUPPORT_EMAIL = "destek.ozunde@gmail.com";

const ISSUE_TYPES = [
  { title: "Bileşenler yanlış okundu", desc: "Etikette olmayan ya da eksik bileşen var" },
  { title: "Ürün adı / marka hatalı", desc: "Başka bir ürünle karışmış" },
  { title: "Değerlendirme yanlış", desc: "Puan ya da risk sınıfı hatalı görünüyor" },
  { title: "Uygunsuz kullanıcı yorumu", desc: "Spam veya hakaret içeriyor" },
  { title: "Uygulama hatası", desc: "Ekran donuyor, analiz tamamlanmıyor" },
];

// Tasarım kaynağı: "15 Sorun bildir" ekranı (9 Eylül 2026).
//
// 9 Eylül düzeltmesi (2. tur — kullanıcı: "sorun bildir butonuna bassın
// yeter kullanıcıyı uğraştırmayalım, butona bastığı anda bana direkt mail
// gelsin otomatik atsın"): "Bildirimi gönder" artık GERÇEKTEN otomatik —
// backend'deki /report-problem endpoint'ine POST atıyoruz, o da Resend
// üzerinden bir e-posta gönderiyor (bkz. server/src/reportProblem.js).
// Kullanıcı hiçbir ek adım atmıyor, mail uygulaması AÇILMIYOR.
//
// Backend bu iş için kurulmadıysa (EXPO_PUBLIC_API_URL yok) ya da otomatik
// gönderim bir sebeple başarısız olursa (ağ hatası, Resend/env eksik vb.),
// kullanıcıyı YARI YOLDA bırakmamak için eski mailto: yoluna DÜŞÜYORUZ —
// bu durumda dürüstçe "mail uygulaman açıldı" diyoruz (bkz. ReportSentScreen
// içindeki "autoSent" parametresi).
export default function ReportProblemScreen({ route, navigation }: Props) {
  const analysis = route.params?.analysis;
  const [issueIdx, setIssueIdx] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [productHint, setProductHint] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // ScanScreen'deki galeri seçimiyle aynı desen (bkz. pickFromGallery) —
  // launchImageLibraryAsync izni kendi içinde zaten soruyor, ayrıca elle
  // requestMediaLibraryPermissionsAsync çağırmaya gerek yok.
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Eski mailto: yolu — artık SADECE yedek (backend kurulmadıysa ya da
  // otomatik gönderim başarısız olursa) kullanılıyor, bkz. dosya başındaki not.
  const fallbackToMailto = async (issue: { title: string; desc: string }) => {
    const subjectParts = ["[özünde] Sorun bildirimi:", issue.title];
    const bodyLines = [
      `Sorun türü: ${issue.title} (${issue.desc})`,
      analysis ? `Ürün: ${analysis.productName}${analysis.brand ? " · " + analysis.brand : ""}` : null,
      analysis ? `Analiz tarihi: ${new Date(analysis.createdAt).toLocaleString("tr-TR")}` : null,
      !analysis && productHint.trim() ? `Ürün / analiz notu: ${productHint.trim()}` : null,
      "",
      "Açıklama:",
      description.trim() || "(boş bırakıldı)",
      photoUri ? "\n(Not: bir etiket fotoğrafı seçildi ama bu mailde otomatik eklenmedi — istersen mail'e elle ekleyebilirsin.)" : null,
    ].filter((l): l is string => l !== null);

    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subjectParts.join(" "))}&body=${encodeURIComponent(
      bodyLines.join("\n")
    )}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Mail uygulaması bulunamadı", `Lütfen doğrudan ${SUPPORT_EMAIL} adresine yazabilirsin.`);
      return false;
    }
    await Linking.openURL(url);
    return true;
  };

  const handleSubmit = async () => {
    if (issueIdx === null) {
      Alert.alert("Sorun türü seç", "Lütfen aşağıdaki listeden bir sorun türü seç.");
      return;
    }
    const issue = ISSUE_TYPES[issueIdx];
    setSending(true);
    try {
      // Backend bağlıysa önce GERÇEK otomatik gönderimi dene — kullanıcı
      // hiçbir ek adım atmadan bildirim bize e-posta olarak ulaşsın.
      if (isReportBackendConfigured()) {
        try {
          await sendProblemReport({
            issueTitle: issue.title,
            issueDesc: issue.desc,
            description: description.trim(),
            productHint: !analysis ? productHint.trim() || undefined : undefined,
            productName: analysis?.productName,
            productBrand: analysis?.brand,
            analysisDateText: analysis ? new Date(analysis.createdAt).toLocaleString("tr-TR") : undefined,
            photoUri,
          });
          navigation.replace("ReportSent", { autoSent: true });
          return;
        } catch (err: any) {
          // Otomatik gönderim başarısız oldu (ağ hatası, backend'de
          // RESEND_API_KEY/REPORT_EMAIL_TO eksik vb.) — kullanıcıyı yarı
          // yolda bırakmamak için sessizce eski mailto: yoluna düşüyoruz.
          console.warn("[ReportProblem] Otomatik gönderim başarısız, mailto'ya düşülüyor:", err?.message);
        }
      }
      const opened = await fallbackToMailto(issue);
      if (opened) navigation.replace("ReportSent", { autoSent: false });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
          <ChevronLeft size={15} color={colors.primaryDark} />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sorun bildir</Text>
        <Text style={styles.subtitle}>
          Bu analizde yanlış gördüğün bir şey mi var? Bildirimin ürün verisini düzeltmek için incelenir.
        </Text>

        {analysis ? (
          <View style={styles.productCard}>
            <View style={styles.productThumb} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.productName} numberOfLines={1}>{analysis.productName}</Text>
              <Text style={styles.productMeta} numberOfLines={1}>
                {analysis.brand ? `${analysis.brand} · ` : ""}
                {new Date(analysis.createdAt).toLocaleString("tr-TR")} tarihli analiz
              </Text>
            </View>
          </View>
        ) : (
          <TextInput
            style={styles.hintInput}
            placeholder="Hangi ürün / analizle ilgili? (opsiyonel)"
            placeholderTextColor={colors.textFaint}
            value={productHint}
            onChangeText={setProductHint}
          />
        )}

        <Text style={styles.sectionLabel}>Sorun türü</Text>
        <View style={styles.issueCard}>
          {ISSUE_TYPES.map((issue, idx) => {
            const selected = issueIdx === idx;
            return (
              <TouchableOpacity
                key={issue.title}
                style={[styles.issueRow, idx < ISSUE_TYPES.length - 1 && styles.issueRowDivider]}
                onPress={() => setIssueIdx(idx)}
                activeOpacity={0.7}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.issueTitle}>{issue.title}</Text>
                  <Text style={styles.issueDesc}>{issue.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Açıklama</Text>
        <TextInput
          style={styles.textArea}
          placeholder='Neyin yanlış olduğunu kısaca yaz (örn. "Parfum etiketimde yok")'
          placeholderTextColor={colors.textFaint}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto} activeOpacity={0.8}>
          {photoUri ? (
            <>
              <Image source={{ uri: photoUri }} style={styles.photoThumb} />
              <Text style={styles.photoBtnText}>Fotoğraf seçildi — değiştir</Text>
            </>
          ) : (
            <>
              <ImageOffIcon size={16} color={colors.textMuted} />
              <Text style={styles.photoBtnText}>Etiket fotoğrafı ekle (opsiyonel)</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSubmit} disabled={sending} activeOpacity={0.9} style={{ marginTop: spacing.lg }}>
          <View style={styles.submitBtn}>
            {issueIdx !== null && <CheckIcon size={13} color="#fff" strokeWidth={3} />}
            <Text style={styles.submitBtnText}>{sending ? "Gönderiliyor..." : "Bildirimi gönder"}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.footnote}>
          Bildirimin bize otomatik olarak e-posta ile ulaşır — ek bir şey yapmana gerek yok.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.md },
  backText: { color: colors.primaryDark, fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.6, color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: 11.5, lineHeight: 18, marginTop: spacing.xs, marginBottom: spacing.lg },

  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  productThumb: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface },
  productName: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold },
  productMeta: { color: colors.textFaint, fontSize: 10.5, marginTop: 2 },

  hintInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    color: colors.text,
    fontSize: 12.5,
    marginBottom: spacing.md,
  },

  sectionLabel: { fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: fontFamily.semibold, color: colors.textFaint, marginBottom: spacing.sm },
  issueCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.card,
    marginBottom: spacing.md,
  },
  issueRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md },
  issueRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  issueTitle: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold },
  issueDesc: { color: colors.textFaint, fontSize: 10.5, marginTop: 2 },

  textArea: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    color: colors.text,
    fontSize: 12.5,
    lineHeight: 18,
    minHeight: 84,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },

  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    padding: spacing.md,
  },
  photoThumb: { width: 28, height: 28, borderRadius: 8 },
  photoBtnText: { color: colors.textMuted, fontSize: 12, fontFamily: fontFamily.semibold },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...shadows.glow(colors.primaryDark),
  },
  submitBtnText: { color: "#fff", fontSize: 14, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  footnote: { color: colors.textFaint, fontSize: 10.5, textAlign: "center", marginTop: spacing.sm, lineHeight: 15 },
});
