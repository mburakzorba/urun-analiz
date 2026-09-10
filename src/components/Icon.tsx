import React from "react";
import Svg, { Circle, Path, Line } from "react-native-svg";

// Tasarım kaynağındaki (Claude Design "Kozmetik İçerik Analizi" export'u)
// çizgi ikonlarla BİREBİR aynı path veriler — stroke-width 2.75, round
// cap/join. Emoji yerine bu ikonlar kullanılıyor artık, tasarımın çizgi
// ikon diline sadık kalmak için.

type IconProps = { size?: number; color?: string; strokeWidth?: number };

const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const });

export function ChevronLeft({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRight({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CameraIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M14.5 4h-5L8 6.5H5a2 2 0 0 0-2 2V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-3L14.5 4Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12.5} r={3.2} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function StarIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.5l6.3-.9L12 3Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AlertTriangleIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M10.3 3.9 2.6 17.2A1.9 1.9 0 0 0 4.3 20h15.4a1.9 1.9 0 0 0 1.7-2.8L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Tasarımda hem "Geçmiş" sekmesi hem de Ana Sayfa'daki "iki ürünü karşılaştır"
// kartı için kullanılan aynı ikon (takvim/kutu çizgisi).
export function HistoryIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M8 3v4M16 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M20 6 9 17l-5-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HomeIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function UserIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx={12} cy={8} r={3.6} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M5 20c1.3-3.4 4-5 7-5s5.7 1.6 7 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 15, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Kamera ekranındaki "kapat" (X) butonu — tasarım kaynağında düz metin "✕"
// yerine bu çizgi ikon kullanılıyor.
export function CloseIcon({ size = 16, color = "#fff", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M18 6 6 18M6 6l12 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Kamera ekranındaki flaş/ışık butonu — tasarım kaynağında emoji (💡/🔦)
// yerine bu ampul çizgi ikonu kullanılıyor.
export function FlashIcon({ size = 15, color = "#FFD97A", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.05V17h6v-2.25c0-.85.4-1.55 1-2.05A7 7 0 0 0 12 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// "özünde" büyüteç maskotu — marka ikonu (Onboarding, Açılış/splash gibi
// yerlerde). Kaynak: export edilen tasarımın bundler thumbnail SVG'si.
export function MascotIcon({ size = 44, color = "#E48343" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Circle cx={20} cy={22} r={11.5} stroke={color} strokeWidth={4.6} />
      <Line x1={28.6} y1={30.6} x2={36} y2={38} stroke={color} strokeWidth={5.2} strokeLinecap="round" />
      <Circle cx={15.5} cy={6.5} r={2.4} fill={color} />
      <Circle cx={24.5} cy={6.5} r={2.4} fill={color} />
    </Svg>
  );
}

// --- 9 Eylül eklemeleri: "kalan tasarımlar" turunda ihtiyaç duyulan yeni
// çizgi ikonlar — hepsi aynı dil (stroke-width 2.75, round cap/join).

export function SearchIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx={11} cy={11} r={6.5} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M20 20l-4.3-4.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function SettingsIcon({ size = 18, color = "#201E1D", strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M12 3.5v2.1M12 18.4v2.1M20.5 12h-2.1M5.6 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8 6.3 6.3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BellIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M6 10.5a6 6 0 1 1 12 0v3.4l1.6 2.4H4.4L6 13.9v-3.4Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 19a2 2 0 0 0 4 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CreditCardIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M4 7h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 11h18" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function MailIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M4.5 6h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 7.3 12 13l8-5.7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LogoutIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M15.5 16 20 12l-4.5-4M20 12H9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function WifiOffIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M3 8.5a16 16 0 0 1 6.5-3.1M20.9 8.5a16 16 0 0 0-5-2.7M6.5 12.2a10.5 10.5 0 0 1 4.4-1.9M17.4 12.2a10.5 10.5 0 0 0-2.9-1.6M9.8 15.9a5 5 0 0 1 4.3 0"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={19} r={1.1} fill={color} />
      <Path d="M2.5 2.5l19 19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ImageOffIcon({ size = 18, color = "#201E1D", strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M4.5 5h11a1.5 1.5 0 0 1 1.5 1.5v11c0 .2 0 .4-.1.5M19.5 16v-9A1.5 1.5 0 0 0 18 5.5H8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 19 9.5 12l3 3.2L15 13l4 4.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2.5 2.5l19 19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
