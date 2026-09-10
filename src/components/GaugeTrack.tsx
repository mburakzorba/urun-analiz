import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, radius, shadows } from "../theme";
import { GAUGE_TRACK_COLORS } from "../utils/verdict";

// Tasarımdaki ".track/.knob/.sl" bileşeninin birebir karşılığı: kırmızı→
// turuncu→zeytin sürekli degrade bir bar, üzerinde skora göre konumlanan
// yuvarlak bir "knob", altında 5 kademenin TAMAMININ ismi (aktif olan
// koyu/kalın). Eskiden (v3) 5 ayrı renkli blok + üstte pill etiket olan
// ScoreGauge'un yerini aldı — tasarımda kademeler arası keskin blok yok,
// sürekli bir gradient var.

export type GaugeZone = { label: string; color: string };

type Props = {
  score: number;
  title: string;
  zoneFor: (score: number) => GaugeZone;
  labels: [string, string, string, string, string];
  caption?: string;
  // Sağ üstte küçük bir durum rozeti (tasarımdaki "Güvenli"/"Önerilir" pill).
  // Verilmezse zoneFor'dan gelen etiket kullanılır.
  badgeLabel?: string;
};

export default function GaugeTrack({ score, title, zoneFor, labels, caption, badgeLabel }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const zone = zoneFor(clamped);
  const activeIndex = clamped < 20 ? 0 : clamped < 40 ? 1 : clamped < 60 ? 2 : clamped < 80 ? 3 : 4;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.badge, { borderColor: zone.color }]}>
          <Text style={[styles.badgeText, { color: zone.color }]}>{badgeLabel ?? zone.label}</Text>
        </View>
      </View>

      <View style={styles.trackOuter}>
        <LinearGradient
          colors={GAUGE_TRACK_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.track}
        />
        <View style={[styles.knob, { left: `${clamped}%` }]} />
      </View>

      <View style={styles.labelsRow}>
        {labels.map((label, i) => (
          <Text key={i} style={[styles.label, i === activeIndex && styles.labelActive]} numberOfLines={2}>
            {label}
          </Text>
        ))}
      </View>

      {!!caption && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: spacing.xs },
  title: { color: colors.text, fontSize: 14.5, fontWeight: "600", letterSpacing: -0.2 },
  badge: { height: 24, borderRadius: radius.pill, borderWidth: 1.5, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 10.5, fontWeight: "700" },
  trackOuter: { position: "relative", marginTop: spacing.md, marginBottom: 4 },
  track: { height: 9, borderRadius: radius.pill },
  knob: {
    position: "absolute",
    top: -4,
    marginLeft: -8.5,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#fff",
    borderWidth: 2.5,
    borderColor: colors.text,
    ...shadows.card,
  },
  labelsRow: { flexDirection: "row", marginTop: spacing.xs },
  label: { flex: 1, textAlign: "center", color: colors.textFaint, fontSize: 8, lineHeight: 11, fontWeight: "600" },
  labelActive: { color: "#2F3D18" },
  caption: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm, lineHeight: 17 },
});
