import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows } from "../theme";
import { useUserProfile } from "../context/UserProfileContext";
import { SkinType, SKIN_TYPES, COMMON_ALLERGENS } from "../types";
import { MascotIcon, AlertTriangleIcon, CameraIcon, PlusIcon } from "../components/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

// Eskiden (v1-v3) sadece 3 bilgilendirme slaytıydı. Tasarım kaynağındaki
// (Claude Design "Kozmetik İçerik Analizi" export'u — 00/00b/00c ekranları)
// onboarding artık FONKSİYONEL: cilt tipi ve bilinen alerjiler burada
// toplanıyor (ProfileEditScreen'deki aynı veri modeline yazılıyor —
// UserProfileContext), üçüncü adım da nasıl çalıştığını anlatıp direkt
// kameraya götürüyor. Kullanıcı isterse cilt tipini/alerjilerini boş
// bırakıp geçebilir, profili istediği an Profil sekmesinden tamamlar.
export const ONBOARDING_KEY = "urun-analiz:onboardingSeen";

function IconAvatar({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.iconAvatarOuter}>
      <View style={styles.iconAvatarInner}>{children}</View>
    </View>
  );
}

function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.pill, selected ? styles.pillSelected : styles.pillUnselected]}>
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen({ navigation }: Props) {
  const { profile, saveProfile } = useUserProfile();
  const [step, setStep] = useState(0);
  const [skinType, setSkinType] = useState<SkinType | undefined>(profile.skinType);
  const [allergies, setAllergies] = useState<string[]>(profile.allergies || []);
  const [showCustomAllergy, setShowCustomAllergy] = useState(false);
  const [otherAllergyNote, setOtherAllergyNote] = useState(profile.otherAllergyNote || "");

  const toggleAllergy = (a: string) => {
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const finish = async () => {
    try {
      await saveProfile({
        skinType,
        hairType: profile.hairType,
        allergies,
        otherAllergyNote: otherAllergyNote.trim() || undefined,
        completedAt: profile.completedAt,
      });
      await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    } finally {
      navigation.replace("MainTabs");
      navigation.navigate("Scan");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.progressSeg, i === step && styles.progressSegActive]} />
          ))}
        </View>

        {step === 0 && (
          <>
            <IconAvatar>
              <MascotIcon size={24} color={colors.primary} />
            </IconAvatar>
            <Text style={styles.kicker}>Adım 1 / 3</Text>
            <Text style={styles.headline}>Cilt profilin,{"\n"}analizin temeli</Text>
            <Text style={styles.paragraph}>
              Bileşen değerlendirmesi cilt tipine ve hassasiyetlerine göre değişir. Bir kez tanımla, her analiz sana göre hesaplansın.
            </Text>
            <Text style={styles.fieldLabel}>Cilt tipi</Text>
            <View style={styles.pillRow}>
              {SKIN_TYPES.map((t) => (
                <Pill key={t} label={t} selected={skinType === t} onPress={() => setSkinType(skinType === t ? undefined : t)} />
              ))}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <IconAvatar>
              <AlertTriangleIcon size={22} color={colors.primary} />
            </IconAvatar>
            <Text style={styles.kicker}>Adım 2 / 3</Text>
            <Text style={styles.headline}>Neye tepki{"\n"}veriyorsun?</Text>
            <Text style={styles.paragraph}>Seçtiğin alerjenler bir üründe geçtiğinde analizde kırmızı uyarı olarak öne çıkar.</Text>
            <Text style={styles.fieldLabel}>Bilinen alerjilerin</Text>
            <View style={styles.pillRow}>
              {COMMON_ALLERGENS.map((a) => (
                <Pill key={a} label={a} selected={allergies.includes(a)} onPress={() => toggleAllergy(a)} />
              ))}
            </View>
            {showCustomAllergy ? (
              <TextInput
                style={styles.customInput}
                placeholder="Listede olmayan bir alerjin varsa buraya yaz"
                placeholderTextColor={colors.textFaint}
                value={otherAllergyNote}
                onChangeText={setOtherAllergyNote}
                autoFocus
                multiline
              />
            ) : (
              <TouchableOpacity style={styles.customRow} onPress={() => setShowCustomAllergy(true)} activeOpacity={0.8}>
                <PlusIcon size={15} color={colors.primaryDark} />
                <Text style={styles.customRowText}>Listede olmayan alerjini yaz</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <IconAvatar>
              <CameraIcon size={22} color={colors.primary} />
            </IconAvatar>
            <Text style={styles.kicker}>Adım 3 / 3</Text>
            <Text style={styles.headline}>Nasıl{"\n"}çalışıyor?</Text>
            <View style={styles.stepsList}>
              <StepRow n={1} title="İçindekiler kısmını çek" desc={'Ambalajın arkasındaki "İçindekiler / Ingredients" yazısını çerçeveye sığdır. Etiketinde bu bölüm yoksa ürünün ön ve arka yüzünü çek — kalanını biz tamamlarız.'} />
              <StepRow n={2} title="Bileşenler tek tek çözümlenir" desc="Riskli, dikkat ve faydalı olarak sınıflanır" />
              <StepRow n={3} title="Sana özel sonuç" desc="Profilin ve kullanıcı görüşleriyle birlikte" />
            </View>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                Ücretsiz planda <Text style={styles.noteBold}>3 ürün</Text> deneme hakkın var. Sonuçlar bilgilendirme amaçlıdır, tıbbi tavsiye değildir.
              </Text>
            </View>
          </>
        )}

        <View style={{ flex: 1 }} />

        {/* NOT (6 Eylül düzeltmesi): tasarım kaynağında (00/00b/00c
            Onboarding ekranları) bu buton GRADYAN DEĞİL, düz #C67139
            (colors.primary). Önceki turda yanlışlıkla gradyan uygulanmıştı. */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => (step < 2 ? setStep(step + 1) : finish())}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{step === 0 ? "Devam et" : step === 1 ? "Devam et" : "İlk ürünümü tara"}</Text>
        </TouchableOpacity>

        {step === 0 && (
          <TouchableOpacity onPress={() => setStep(1)}>
            <Text style={styles.skipText}>Şimdilik atla</Text>
          </TouchableOpacity>
        )}
        {step === 1 && (
          <TouchableOpacity onPress={() => setStep(2)}>
            <Text style={styles.skipText}>Bilmiyorum, sonra ekleyeceğim</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function StepRow({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing.lg, paddingBottom: spacing.lg },
  progressRow: { flexDirection: "row", gap: 5, marginBottom: spacing.md },
  progressSeg: { height: 3, flex: 1, borderRadius: 99, backgroundColor: "rgba(32,30,29,0.13)" },
  progressSegActive: { backgroundColor: colors.primary },

  iconAvatarOuter: {
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: "#F0E3CD",
    alignSelf: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  iconAvatarInner: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },

  kicker: { textAlign: "center", fontSize: 10, letterSpacing: 1.6, textTransform: "uppercase", fontFamily: fontFamily.bold, color: colors.textFaint },
  headline: { fontSize: 22, fontFamily: fontFamily.bold, letterSpacing: -0.6, lineHeight: 26, textAlign: "center", color: colors.text, marginTop: 6, marginBottom: 8 },
  paragraph: { fontSize: 12.5, lineHeight: 18, color: colors.textMuted, textAlign: "center", marginBottom: spacing.lg },

  fieldLabel: { fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", fontFamily: fontFamily.bold, color: colors.textFaint, marginBottom: spacing.sm },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  pill: { height: 34, borderRadius: 999, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  pillUnselected: { backgroundColor: colors.cardAlt, borderWidth: 1.5, borderColor: "rgba(198,113,57,0.45)" },
  pillSelected: { backgroundColor: colors.primaryDark, ...shadows.glow(colors.primaryDark) },
  pillText: { fontSize: 12.5, fontFamily: fontFamily.semibold, color: colors.primaryDark },
  pillTextSelected: { color: "#fff" },

  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "#FFFDF9",
    borderWidth: 1.5,
    borderColor: "rgba(198,113,57,0.35)",
    paddingHorizontal: 14,
    marginTop: 11,
  },
  customRowText: { fontSize: 12, fontFamily: fontFamily.semibold, color: colors.primaryDark },
  customInput: {
    marginTop: 11,
    minHeight: 60,
    borderRadius: radius.md,
    backgroundColor: "#FFFDF9",
    borderWidth: 1.5,
    borderColor: "rgba(198,113,57,0.35)",
    padding: 14,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: "top",
  },

  stepsList: { gap: spacing.sm, marginBottom: spacing.md },
  stepRow: { flexDirection: "row", gap: 11, alignItems: "flex-start" },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: "rgba(198,113,57,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumberText: { fontSize: 10.5, fontFamily: fontFamily.bold, color: colors.primaryDark },
  stepTitle: { fontSize: 13, fontFamily: fontFamily.semibold, color: colors.text },
  stepDesc: { fontSize: 10.5, color: colors.textMuted, marginTop: 3, lineHeight: 15 },

  noteCard: { backgroundColor: colors.cardAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, padding: 14 },
  noteText: { fontSize: 10.5, color: colors.textMuted, lineHeight: 16 },
  noteBold: { color: colors.text, fontFamily: fontFamily.bold },

  cta: {
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    ...shadows.glow(colors.primaryDark),
  },
  ctaText: { color: "#fff", fontSize: 14.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  skipText: { textAlign: "center", fontSize: 11.5, fontFamily: fontFamily.semibold, color: colors.textFaint, marginTop: 12 },
});
