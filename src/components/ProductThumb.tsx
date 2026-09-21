import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../theme";
import { getProductIconKey } from "../utils/productIcon";
import { LipstickIcon, PerfumeIcon, CreamJarIcon, BottleIcon, SoapIcon, DropperIcon } from "./Icon";

// 11 Eylül eklemesi: Ana Sayfa'daki "Son analizler" ve Sonuç ekranının
// başlığındaki boş kare kutunun yerini alan, ürün kategorisine göre değişen
// ikonlu kutu — bkz. utils/productIcon.ts'teki eşleştirme mantığı.
type Props = {
  category?: string;
  productName?: string;
  size?: number;
};

const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  lipstick: LipstickIcon,
  perfume: PerfumeIcon,
  cream: CreamJarIcon,
  bottle: BottleIcon,
  soap: SoapIcon,
  dropper: DropperIcon,
};

export default function ProductThumb({ category, productName, size = 42 }: Props) {
  const key = getProductIconKey(category, productName);
  const IconComp = ICON_COMPONENTS[key];
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.33 }]}>
      <IconComp size={Math.round(size * 0.5)} color={colors.primaryDark} strokeWidth={2.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", flexShrink: 0 },
});
