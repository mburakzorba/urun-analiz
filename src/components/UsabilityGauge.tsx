import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../theme";

// Skala: soldan sağa "Kaçının" -> "Çok İyi". Kesin bir sayı GÖSTERMİYORUZ
// (ResultScreen'de daha önce numaralı skor halkalarını bu yüzden kaldırmıştık —
// yanıltıcı derecede kesin görünüyordu). Bunun yerine sadece bir gösterge
// (marker) barın üzerinde nereye denk geldiğini gösteriyor, tıpkı bir yakıt
// göstergesi gibi — göz atınca "iyiye mi kötüye mi yakın" hemen anlaşılıyor.

const SEGMENT_COLORS = ["#F87171", "#FB923C", "#FACC15", "#A3E635", "#4ADE80"];

function zoneFor(score: number): { label: string; color: string } {
  if (score < 20) return { label: "Kaçının", color: "#F87171" };
  if (score < 40) return { label: "Riskli", color: "#FB923C" };
  if (score < 60) return { label: "Orta / Kararsız", color: "#FACC15" };
  if (score < 80) return { label: "İyi", color: "#A3E635" };
  return { label: "Çok İyi", color: "#4ADE80" };
}

export default function UsabilityGauge({ score, caption }: { score: number; caption?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const zone = zoneFor(clamped);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Genel Kullanılabilirlik</Text>
        <View style={[styles.zonePill, { borderColor: zone.color }]}>
          <Text style={[styles.zoneText, { color: zone.color }]}>{zone.label}</Text>
        </View>
      </View>

      <View style={styles.barOuter}>
        <View style={styles.barTrack}>
          {SEGMENT_COLORS.map((c, i) => (
            <View key={i} style={[styles.segment, { backgroundColor: c }]} />
          ))}
        </View>
        <View style={[styles.marker, { left: `${clamped}%` }]}>
          <View style={styles.markerDot} />
        </View>
      </View>

      <View style={styles.scaleLabelsRow}>
        <Text style={styles.scaleLabel}>Kötü</Text>
        <Text style={styles.scaleLabel}>İyi</Text>
      </View>

      {!!caption && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: 15, fontWeight: "700" },
  zonePill: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  zoneText: { fontSize: 12, fontWeight: "800" },
  barOuter: { position: "relative" },
  barTrack: {
    flexDirection: "row",
    height: 10,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  segment: { flex: 1, height: 10 },
  marker: {
    position: "absolute",
    top: -5,
    marginLeft: -9,
    alignItems: "center",
  },
  markerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.text,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  scaleLabelsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  scaleLabel: { color: colors.textMuted, fontSize: 10 },
  caption: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm, lineHeight: 17 },
});