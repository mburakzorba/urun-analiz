import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows } from "../theme";
import { ChevronLeft, MailIcon } from "../components/Icon";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

// 16 Eylül eklemesi: gerçek giriş ekranı — ProfileScreen/SettingsScreen'deki
// "E-posta ile giriş yap" artık buraya geliyor (öncesinde sadece "yakında"
// diyen sahte bir buton vardı). Kimlik doğrulamanın kendisi Supabase Auth'ta
// çalışıyor (bkz. context/AuthContext.tsx ve services/supabase.ts).
export default function LoginScreen({ navigation }: Props) {
  const { signInWithEmail, signInWithGoogle, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const result = await signInWithEmail(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigation.goBack();
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleSubmitting(true);
    const result = await signInWithGoogle();
    setGoogleSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    // 20 Eylül eklemesi: Google ile giriş yapıldıktan hemen sonra HER
    // SEFERİNDE "Profilim"den profili tamamlamayı öneriyoruz — zorunlu
    // değil, "Daha sonra" ile eskisi gibi devam edebiliyor. Bilerek
    // isProfileEmpty'e BAKMIYORUZ: profil verisi hesaba değil cihaza bağlı
    // (bkz. AuthContext.tsx başındaki not) — kullanıcı geri bildirimi,
    // farklı bir Google hesabıyla girdiğinde de bu daveti görmek istediği
    // yönünde.
    Alert.alert(
      "Profilini tamamla",
      "Cilt/saç tipini ve varsa alerjilerini eklersen analizler sana özel olur. Profilim'den birkaç saniyede tamamlayabilirsin.",
      [
        { text: "Daha sonra", style: "cancel", onPress: () => navigation.goBack() },
        { text: "Şimdi tamamla", onPress: () => navigation.navigate("ProfileEdit") },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
            <ChevronLeft size={15} color={colors.primaryDark} />
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Giriş yap</Text>
          <Text style={styles.subtitle}>Hesabınla giriş yaparak devam et.</Text>

          {!isConfigured && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Hesap sistemi henüz kurulmadı (Supabase bağlantı bilgileri eksik). Bu ekran şimdilik çalışmaz.
              </Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="ornek@eposta.com"
              placeholderTextColor={colors.textFaint}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textFaint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.9} disabled={!canSubmit || !isConfigured}>
            <View style={[styles.primaryBtn, (!canSubmit || !isConfigured) && styles.btnDisabled]}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Giriş yap</Text>}
            </View>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity onPress={handleGoogle} activeOpacity={0.85} disabled={googleSubmitting || !isConfigured}>
            <View style={[styles.googleBtn, (googleSubmitting || !isConfigured) && styles.btnDisabled]}>
              {googleSubmitting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <View style={styles.googleBadge}>
                    <Text style={styles.googleBadgeText}>G</Text>
                  </View>
                  <Text style={styles.googleBtnText}>Google ile devam et</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace("SignUp")} activeOpacity={0.7} style={styles.footerLink}>
            <MailIcon size={13} color={colors.textMuted} />
            <Text style={styles.footerLinkText}>Hesabın yok mu? Üye ol</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.md },
  backText: { color: colors.primaryDark, fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.6, color: colors.text, marginBottom: 4 },
  subtitle: { color: colors.textMuted, fontSize: 12.5, marginBottom: spacing.lg },

  warningBox: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningText: { color: colors.textMuted, fontSize: 11.5, lineHeight: 17 },

  fieldGroup: { marginBottom: spacing.md },
  label: { color: colors.textMuted, fontSize: 11.5, fontFamily: fontFamily.semibold, marginBottom: 6 },
  input: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.text,
    fontSize: 13.5,
  },

  errorText: { color: colors.danger, fontSize: 12, marginBottom: spacing.md, lineHeight: 17 },

  primaryBtn: {
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    ...shadows.glow(colors.primaryDark),
  },
  primaryBtnText: { color: "#fff", fontSize: 14.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  btnDisabled: { opacity: 0.5 },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.hairline },
  dividerText: { color: colors.textFaint, fontSize: 11 },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  googleBadgeText: { fontSize: 12, fontFamily: fontFamily.bold, color: colors.primaryDark },
  googleBtnText: { color: colors.text, fontSize: 14, fontFamily: fontFamily.semibold },

  footerLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.xl },
  footerLinkText: { color: colors.textMuted, fontSize: 12.5, fontFamily: fontFamily.semibold },
});
