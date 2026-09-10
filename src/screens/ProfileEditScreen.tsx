import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, primaryGradient, primaryGradientLocations, accent as accentRamp } from "../theme";
import { useUserProfile } from "../context/UserProfileContext";
import { SkinType, SKIN_TYPES, HairType, HAIR_TYPES, COMMON_ALLERGENS, Gender, GENDERS } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileEdit">;

// Tasarım kaynağı ("10b Profilim (detay)"): seçili olmayan pill'in zemin
// rengi tam beyaz değil, hafif kırık-beyaz (#FFFDF9) — ScanScreen'deki
// OVERLAY_* sabitleriyle aynı mantık, sadece bu ekranda kullanılıyor.
const PILL_BG = "#FFFDF9";

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  if (!selected) {
    return (
      <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.chipText}>{label}</Text>
      </TouchableOpacity>
    );
  }
  // Seçili pill: tasarımdaki gibi gradyanlı zemin + hafif "glow" gölge.
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={primaryGradient}
        locations={primaryGradientLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.chip, styles.chipSelected]}
      >
        <Text style={styles.chipTextSelected}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// NOT (9 Eylül taşıma): bu dosya eskiden Profil sekmesinin KENDİSİYDİ
// (src/screens/ProfileScreen.tsx). Artık Profil sekmesi tasarımdaki "10
// Profil" menü ekranını gösteriyor (bkz. yeni ProfileScreen.tsx); bu form
// (tasarım "10b Profilim (detay)") kök stack'te ayrı bir "ProfileEdit"
// ekranı olarak, menüdeki "Profilim" satırından push ediliyor. İçerik/stil
// AYNEN korunuyor, sadece navigasyon tipi (MainTabScreenProps → root stack
// NativeStackScreenProps) ve geri dönüş hedefi değişti.
export default function ProfileEditScreen({ navigation }: Props) {
  const { profile, saveProfile } = useUserProfile();
  // 9 Eylül eklemesi (kullanıcı isteği): Ad/Soyad/Yaş/Cinsiyet — bu alanlar
  // şu an hiçbir analiz mantığında KULLANILMIYOR (bkz. types/index.ts'teki
  // not), sadece kullanıcının kendi profilini tanımlaması için. Diğerleri
  // gibi tamamen opsiyonel.
  const [firstName, setFirstName] = useState(profile.firstName || "");
  const [lastName, setLastName] = useState(profile.lastName || "");
  const [age, setAge] = useState(profile.age != null ? String(profile.age) : "");
  const [gender, setGender] = useState<Gender | undefined>(profile.gender);
  const [skinType, setSkinType] = useState<SkinType | undefined>(profile.skinType);
  const [hairType, setHairType] = useState<HairType | undefined>(profile.hairType);
  const [allergies, setAllergies] = useState<string[]>(profile.allergies || []);
  const [otherAllergyNote, setOtherAllergyNote] = useState(profile.otherAllergyNote || "");
  const [saving, setSaving] = useState(false);

  const toggleAllergy = (a: string) => {
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const handleSave = async () => {
    const trimmedAge = age.trim();
    const parsedAge = trimmedAge ? parseInt(trimmedAge, 10) : undefined;
    if (trimmedAge && (Number.isNaN(parsedAge) || parsedAge! < 1 || parsedAge! > 120)) {
      Alert.alert("Yaş geçersiz", "Lütfen geçerli bir yaş gir (1-120 arası) veya alanı boş bırak.");
      return;
    }
    setSaving(true);
    try {
      await saveProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        age: parsedAge,
        gender,
        skinType,
        hairType,
        allergies,
        otherAllergyNote: otherAllergyNote.trim() || undefined,
        completedAt: profile.completedAt,
      });
      Alert.alert("Kaydedildi", "Profilin kaydedildi. Bundan sonraki analizler sana özel değerlendirme de içerecek.", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Profilim</Text>
        <Text style={styles.subtitle}>
          Bu bilgiler taradığın ürünlerin sana özel değerlendirilmesi için kullanılır — örn. belirttiğin bir
          alerjenle karşılaşırsan uyarılırsın. Tamamen opsiyonel, istediğin zaman değiştirebilirsin.
        </Text>

        <Section title="Kişisel Bilgiler" subtitle="Bunlar da tamamen opsiyonel">
          <View style={styles.nameRow}>
            <TextInput
              style={[styles.input, styles.nameInput, { marginTop: 0 }]}
              placeholder="Adın"
              placeholderTextColor={colors.textFaint}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={[styles.input, styles.nameInput, { marginTop: 0 }]}
              placeholder="Soyadın"
              placeholderTextColor={colors.textFaint}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Yaşın"
            placeholderTextColor={colors.textFaint}
            value={age}
            onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text style={[styles.sectionSubtitle, { marginTop: spacing.md, marginBottom: 0 }]}>Cinsiyet</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((g) => (
              <Chip key={g} label={g} selected={gender === g} onPress={() => setGender(gender === g ? undefined : g)} />
            ))}
          </View>
        </Section>

        <Section title="Cilt Tipin">
          <View style={styles.chipRow}>
            {SKIN_TYPES.map((t) => (
              <Chip key={t} label={t} selected={skinType === t} onPress={() => setSkinType(skinType === t ? undefined : t)} />
            ))}
          </View>
        </Section>

        <Section title="Saç Tipin">
          <View style={styles.chipRow}>
            {HAIR_TYPES.map((t) => (
              <Chip key={t} label={t} selected={hairType === t} onPress={() => setHairType(hairType === t ? undefined : t)} />
            ))}
          </View>
        </Section>

        <Section title="Bilinen Alerjilerin" subtitle="Birden fazla seçebilirsin">
          <View style={styles.chipRow}>
            {COMMON_ALLERGENS.map((a) => (
              <Chip key={a} label={a} selected={allergies.includes(a)} onPress={() => toggleAllergy(a)} />
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Listede olmayan bir alerjin varsa buraya yaz (örn. belirli bir marka/madde)"
            placeholderTextColor={colors.textFaint}
            value={otherAllergyNote}
            onChangeText={setOtherAllergyNote}
            multiline
          />
        </Section>

        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.9}>
          <LinearGradient
            colors={primaryGradient}
            locations={primaryGradientLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>{saving ? "Kaydediliyor..." : "Kaydet"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

// Tasarım kaynağı: "10b Profilim (detay)" ekranı — birebir aktarıldı (8 Eylül
// 2026, kullanıcının Claude Design export'undan). Kartlar colors.cardAlt
// zemin + ince hairline kenarlık, pill'ler kırık-beyaz (PILL_BG) zemin +
// seçiliyken gradyan, "Kaydet" butonu tasarımdaki gibi zaten gradyanlı kalıyor.
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  backBtn: { marginBottom: spacing.md },
  backBtnText: { color: accentRamp[600], fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.6, color: colors.text },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11.5,
    lineHeight: 18,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 15, fontFamily: fontFamily.semibold, letterSpacing: -0.3 },
  sectionSubtitle: { color: colors.textFaint, fontSize: 10.5, marginTop: 3, marginBottom: spacing.md },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm },
  nameRow: { flexDirection: "row", gap: spacing.sm },
  nameInput: { flex: 1 },
  chip: {
    height: 32,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PILL_BG,
    borderWidth: 1,
    borderColor: "rgba(32,30,29,0.1)",
  },
  chipSelected: {
    borderWidth: 0,
    ...shadows.glow(colors.primaryDarker),
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  chipText: { color: colors.textMuted, fontSize: 12, fontFamily: fontFamily.semibold, letterSpacing: -0.1 },
  chipTextSelected: { color: "#fff", fontSize: 12, fontFamily: fontFamily.semibold, letterSpacing: -0.1 },
  input: {
    marginTop: spacing.md,
    backgroundColor: PILL_BG,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(32,30,29,0.1)",
    padding: spacing.sm,
    color: colors.text,
    fontSize: 11.5,
    lineHeight: 17,
    minHeight: 48,
    textAlignVertical: "top",
  },
  saveBtn: {
    borderRadius: radius.pill,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    ...shadows.glow(colors.primaryDark),
  },
  saveBtnText: { color: "#fff", fontFamily: fontFamily.semibold, fontSize: 14.5, letterSpacing: -0.2 },
});
