import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { colors } from "../theme";
import { GAUGE_TRACK_COLORS } from "../utils/verdict";

// Tasarımdaki dairesel skor göstergesi: "conic-gradient(#A33B26 0turn, ...,
// rgba(32,30,29,.08) .71turn 1turn)" — yani 0'dan skora kadar 5 renk
// arasında geçiş yapan dolu bir yay, skordan 100'e kadar da nötr/boş bir
// yay. react-native-svg'de conic-gradient yok; aynı görünümü, dolu yayı
// GAUGE_TRACK_COLORS'daki 5 rengin eşit dilimlerine bölerek ayrı <Circle>
// segmentleriyle çiziyoruz.
type Props = { score: number; size?: number; strokeWidth?: number };

export default function ScoreRing({ score, size = 100, strokeWidth = 0 }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const sw = strokeWidth || size * 0.11;
  const r = (size - sw) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const filledLen = (clamped / 100) * circumference;
  const segCount = GAUGE_TRACK_COLORS.length;
  const segLen = filledLen / segCount;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* -90 derece döndürerek 12 yönünden (üstten) başlatıyoruz, CSS
            conic-gradient'in varsayılan başlangıcıyla aynı. */}
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          {/* Nötr arka plan yayı (tam çember) */}
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke="rgba(32,30,29,0.08)"
            strokeWidth={sw}
            fill="none"
          />
          {GAUGE_TRACK_COLORS.map((color, i) => {
            if (segLen <= 0) return null;
            const offset = -(i * segLen);
            return (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                stroke={color}
                strokeWidth={sw}
                strokeDasharray={`${segLen} ${circumference - segLen}`}
                strokeDashoffset={offset}
                strokeLinecap={i === 0 || i === segCount - 1 ? "round" : "butt"}
                fill="none"
              />
            );
          })}
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <Text style={[styles.score, { fontSize: size * 0.28 }]}>{Math.round(clamped)}</Text>
          <Text style={[styles.max, { fontSize: size * 0.08 }]}>100 üzeri</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  score: { fontWeight: "700", letterSpacing: -1.2, color: colors.text, lineHeight: undefined },
  max: { letterSpacing: 0.8, textTransform: "uppercase", color: colors.textFaint, fontWeight: "700", marginTop: 2 },
});
