import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, type } from "../theme";

// Genel amaçlı 5 kademeli gösterge (gauge). ResultScreen'de iki yerde
// kullanılıyor: "Genel Kullanılabilirlik" (sağlık+etkinlik) ve "Kullanıcı
// Görüşü" (yorum ortalaması) — her ikisi de aynı görsel dili paylaşıyor,
// sadece skor kaynağı ve kademe isimleri (zoneFor) farklı.
//
// Kesin bir sayı GÖSTERMİYORUZ (yanıltıcı derecede kesin görünür); bunun
// yerine sadece bir gösterge (marker) barın üzerinde nereye denk geldiğini
// gösteriyor, tıpkı bir yakıt göstergesi gibi.

const SEGMENT_COLORS = ["#F87171", "#FB923C", "#FACC15", "#A3E635", "#4ADE80"];

export type GaugeZone = { label: string; color: string };

type Props = {
  score: number;
  title: string;
  zoneFor: (score: number) => GaugeZone;
  // Barın altında SADECE iki uç (en düşük/en yüksek) değil, 5 kademenin
  // TAMAMININ ismi kendi segmentinin altında gösteriliyor — kullanıcı skorun
  // hangi kategoriye denk geldiğini aradaki diğer kademelerin isimlerini de
  // görerek anlıyor.
  labels: [string, string, string, string, string];
  caption?: string;
};

export default function ScoreGauge({ score, title, zoneFor, labels, caption }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const zone = zoneFor(clamped);
  const activeIndex = clamped < 20 ? 0 : clamped < 40 ? 1 : clamped < 60 ? 2 : clamped < 80 ? 3 : 4;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
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
        {labels.map((label, i) => (
          <Text
            key={i}
            style={[
              styles.scaleLabel,
              i === activeIndex && { color: zone.color, fontWeight: "800" },
            ]}
            numberOfLines={2}
          >
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
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  title: { color: colors.text, ...type.headline },
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
  scaleLabelsRow: { flexDirection: "row", marginTop: spacing.xs },
  scaleLabel: { flex: 1, textAlign: "center", color: colors.textMuted, fontSize: 9, lineHeight: 12 },
  caption: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm, lineHeight: 17 },
});