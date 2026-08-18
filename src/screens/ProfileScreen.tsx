import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius } from "../theme";
import { useUserProfile } from "../context/UserProfileContext";
import { SkinType, SKIN_TYPES, UserGoal, USER_GOALS, COMMON_ALLERGENS } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { profile, saveProfile } = useUserProfile();
  const [skinType, setSkinType] = useState<SkinType | undefined>(profile.skinType);
  const [goals, setGoals] = useState<UserGoal[]>(profile.goals || []);
  const [allergies, setAllergies] = useState<string[]>(profile.allergies || []);
  const [otherAllergyNote, setOtherAllergyNote] = useState(profile.otherAllergyNote || "");
  const [saving, setSaving] = useState(false);

  const toggleGoal = (g: UserGoal) => {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };
  const toggleAllergy = (a: string) => {
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({
        skinType,
        goals,
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Profilim</Text>
        <Text style={styles.subtitle}>
          Bu bilgiler taradığın ürünlerin sana özel değerlendirilmesi için kullanılır — örn. belirttiğin bir
          alerjenle karşılaşırsan uyarılırsın. Tamamen opsiyonel, istediğin zaman değiştirebilirsin.
        </Text>

        <Section title="Cilt Tipin">
          <View style={styles.chipRow}>
            {SKIN_TYPES.map((t) => (
              <Chip key={t} label={t} selected={skinType === t} onPress={() => setSkinType(skinType === t ? undefined : t)} />
            ))}
          </View>
        </Section>

        <Section title="Ne İstiyorsun?" subtitle="Birden fazla seçebilirsin">
          <View style={styles.chipRow}>
            {USER_GOALS.map((g) => (
              <Chip key={g} label={g} selected={goals.includes(g)} onPress={() => toggleGoal(g)} />
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
            placeholderTextColor={colors.textMuted}
            value={otherAllergyNote}
            onChangeText={setOtherAllergyNote}
            multiline
          />
        </Section>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? "Kaydediliyor..." : "Kaydet"}</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  backBtn: { marginBottom: spacing.md },
  backBtnText: { color: colors.accent, fontSize: 15, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 20 },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  sectionSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.cardAlt,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: "rgba(74, 222, 128, 0.15)" },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: colors.primary },
  input: {
    marginTop: spacing.md,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 13,
    minHeight: 44,
    textAlignVertical: "top",
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  saveBtnText: { color: "#0F1115", fontWeight: "700", fontSize: 16 },
});