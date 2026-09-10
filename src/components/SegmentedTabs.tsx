import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, radius } from "../theme";

// Tasarımdaki ".seg" bileşeni — Sonuç ekranındaki Genel/Bileşenler/Yorumlar
// sekme geçişi. Kapsayıcı krem-gri (neutral-200), aktif sekme beyaz kart +
// hafif gölge.
type Props<T extends string> = {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
};

export default function SegmentedTabs<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#EEE7DB",
    borderRadius: radius.md,
    padding: 4,
  },
  item: {
    flex: 1,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemActive: {
    backgroundColor: "#fff",
    shadowColor: "#2E2B25",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  label: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  labelActive: { color: colors.text },
});
