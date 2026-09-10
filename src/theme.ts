// --- "özünde" marka kimliği (v4, 6 Eylül 2026) ---
// Kullanıcının kendi Claude Design projesinden ("Kozmetik İçerik Analizi -
// Ekran Seti") BİREBİR aktarıldı — proje export edilip (.html) ham kaynağı
// okunarak tam renk/tipografi/ölçü değerleri çıkarıldı. Önceki iki tema
// denemesi (koyu tema, sonra açık teal/lacivert v3) tamamen bu paletle
// değiştirildi. Sıcak krem zemin + toprak turuncusu (terracotta) vurgu +
// zeytin yeşili ikincil renk — tasarımdaki "Organic" design-system
// token'larının (--color-*, --space-*, --radius-*) doğrudan karşılığı.
// NOT (7 Eylül düzeltmesi): bg/surface/cardAlt ve aşağıdaki primary ailesi
// artık tasarımın HAM CSS değerleri değil, ondan hafifçe (HSL'de +%2-3
// doygunluk/parlaklık) sapan, kasıtlı olarak canlandırılmış değerler — bkz.
// primary'nin üstündeki uzun not. Bu üçü de aynı gerekçeyle değişti: gerçek
// Android cihazlarda zemin kremi "kaybolup" her şey tek bir turuncu blok
// gibi görünüyordu, zemin ile turuncu arasındaki ayrımı biraz daha
// belirginleştirdik.
export const colors = {
  bg: "#FAF2E6", // --color-bg (v6) — v5 #F8EFE0, orijinal #F5EAD8
  surface: "#F1E5D1", // --color-surface (v6) — v5 #EFE2CC, orijinal #EBDDC5
  card: "#FFFFFF", // ekranlardaki somut .card zemini (beyaz)
  cardAlt: "#F9F3EB", // ekranlarda sık kullanılan yumuşak şeftali kart/pill zemini (v6) — v5 #F7F0E5, orijinal #F5EDE0
  text: "#201E1D", // --color-text
  // NOT (kullanıcı geri bildirimi, 6 Eylül): tasarımın KENDİ kaynak CSS'i de
  // ikincil metinlerde birebir bu opaklıkları kullanıyor (örn. `.p{color:
  // rgba(32,30,29,.55)}`, `.k{...,.42}`) — yani bu değerler tasarıma sadık.
  // Ama tasarım bir tarayıcıda/büyük ekranda görülüyor; gerçek telefonda,
  // özellikle 10-12px gibi küçük yazı boyutlarında bu kadar düşük opaklık
  // WCAG kontrast eşiğinin altına düşüp "soluk" okunuyor. Bu yüzden ikincil
  // metin rengini kasıtlı olarak tasarımdakinden biraz daha koyu/okunur
  // yapıyoruz — hiyerarşi (ana metinden daha soluk olması) korunuyor, sadece
  // gerçek cihazda okunabilir seviyeye çekiliyor.
  textMuted: "rgba(32, 30, 29, 0.68)",
  textFaint: "rgba(32, 30, 29, 0.52)",
  border: "rgba(32, 30, 29, 0.16)", // --color-divider
  hairline: "rgba(32, 30, 29, 0.08)",
  // NOT (7 Eylül düzeltmesi — kullanıcı geri bildirimi): gerçek Android
  // cihazlarda (2 farklı telefonda test edildi) tasarımın ham `#C67139`
  // değeri gözle görülür şekilde soluk/koyu duruyordu — "Doğal" ekran
  // moduna geçmeyi denedik ama telefonda böyle bir seçenek bile yoktu, ve
  // gerçek kullanıcıların ekran ayarıyla uğraşmayacağı zaten belli. Bu
  // yüzden ekran ayarını değiştirmek yerine RENGİN KENDİSİNİ, ortalama bir
  // Android telefonda tasarımdaki "canlı" hissi verecek şekilde kasıtlı
  // olarak biraz daha doygun/parlak hale getirdik (HSL: doygunluk +%10-12,
  // parlaklık +%4-5). iPhone'da (LCD panel) yapılan ayrı bir teste göre bu
  // değişiklik orada da daha canlı görünüyor, daha soluk değil — yani genel
  // olarak güvenli bir yön.
  // 7 Eylül — ikinci tur (kullanıcı: "bir tık daha açabiliriz"): aynı
  // yönde bir kademe daha (doygunluk +%8, parlaklık +%3, önceki v5
  // değerlerinden).
  primary: "#E48343", // --color-accent (CTA, aktif durumlar) — v5 #D97C3F, orijinal #C67139
  primaryDark: "#BD550E", // accent-700 — v5 #A75014, orijinal #8C491A
  primaryDarker: "#612F0D", // accent-900 — v5 #50290F, orijinal #402310
  secondary: "#7A8A5E", // --color-accent-2 (zeytin yeşili)
  // Geriye dönük uyumluluk: henüz bu aktarım turunda restyle edilmemiş
  // ekranlar (Scan/History/Compare/Analyzing/Profile) hâlâ colors.accent /
  // colors.danger / colors.warning kullanıyor — yeni palette'in karşılığına
  // bağlıyoruz ki hem derlensin hem de görsel olarak tutarlı kalsın. Bu
  // ekranlar sıradaki aktarım turunda tam olarak yeniden ele alınacak.
  accent: "#E48343",
  danger: "#A33B26",
  warning: "#D98E3A",
};

// Tasarımdaki HER ana CTA butonu (İzin ver / Analiz et / Kaydet / Premium'a
// geç / Karşılaştır / Devam et) düz bir renk değil, bu üç durağa sahip
// diyagonal degrade: "linear-gradient(140deg,#D9803F,#B2622D 60%,#8C491A)".
// Önceki aktarım turunda bu butonları düz `colors.primary` ile
// uygulamıştık — bu, tasarımdaki "canlı" hissi kaybettiriyordu (kullanıcı
// geri bildirimi, 6 Eylül). Artık ana CTA butonları `expo-linear-gradient`
// ile bu sabitleri kullanıyor.
// 7 Eylül düzeltmesi (2. tur): primary ile aynı gerekçeyle bu üç durak da
// hafifçe canlandırıldı — v5 ["#E78A46", "#CE6825", "#A75014"], orijinal
// ["#D9803F", "#B2622D", "#8C491A"].
export const primaryGradient: [string, string, string] = ["#F1914C", "#E36D20", "#BD550E"];
export const primaryGradientLocations: [number, number, number] = [0, 0.6, 1];

// MainTabs.tsx'teki YÜZEN sekme çubuğunun (position:absolute) sabit
// yüksekliği — React Navigation'ın normal tabBarStyle hesaplamasına dahil
// olmadığı için, bu barın ALTINDA kalmaması gereken her ekran (ör.
// HistoryScreen'in kendi absolute konumlu "Karşılaştır" bar'ı) kendi alt
// boşluğuna bunu elle eklemeli. Bu sabiti burada (theme.ts'te) tutuyoruz —
// MainTabs.tsx'ten export etmek HistoryScreen ↔ MainTabs arasında dairesel
// bir import (circular import) yaratırdı, bundan kaçınıyoruz.
// Hesap: wrap paddingTop(4) + bar padding(6+6) + sekme içi
// paddingVertical(8+8) + ikon/etiket içeriği(~33) ≈ 65px — üstüne biraz
// nefes payı ekleyip 78 kullanıyoruz. `insets.bottom` bu sabite dahil
// DEĞİL, ayrıca eklenmeli (barın kendisi de insets.bottom kadar
// paddingBottom alıyor, bkz. MainTabs.tsx > CustomTabBar > wrap style).
export const FLOATING_TAB_BAR_HEIGHT = 78;

// Tasarım sistemindeki tonal ramp'ler — OKLCH'de üretilmiş, ortak bir
// açıklık skalasında. Bileşenler duruma göre doğrudan bu adımlardan birini
// kullanıyor (ör. "riskli" rozet accent2.700, "dikkat" accent.500 gibi) —
// tasarımdaki inline renklerle birebir eşleşsin diye küçük bir semantik
// palet yerine tüm ramp'i taşıyoruz.
export const neutral = {
  100: "#F9F4ED",
  200: "#EEE7DB",
  300: "#DCD3C4",
  400: "#C0B6A5",
  500: "#A19786",
  600: "#82796A",
  700: "#645C50",
  800: "#474238",
  900: "#2E2B25",
};

export const accent = {
  100: "#FFF2EB",
  200: "#FFE1D0",
  300: "#FFC6A5",
  400: "#F6A06B",
  500: "#D67F48",
  600: "#B2622D",
  700: "#8C491A",
  800: "#643312",
  900: "#402310",
};

export const accent2 = {
  100: "#F0FAE1",
  200: "#E1EECC",
  300: "#CCDBB2",
  400: "#AEBF92",
  500: "#8FA073",
  600: "#728157",
  700: "#56633F",
  800: "#3D472B",
  900: "#272E1B",
};

// Ekranlarda "riskli" ingredient rozetleri için ayrı bir kırmızı-kahve
// familyası kullanılıyor (accent ramp'inden değil) — tasarımdaki tam
// değerler.
export const danger = {
  bg: "#FBE4DE",
  border: "#A33B26",
  solid: "#A33B26",
  text: "#7A2A17",
};

export const warning = {
  bg: "#FFF1E3",
  border: "#D98E3A",
  solid: "#D98E3A",
  text: "#7A4E12",
};

export const good = {
  bg: "#EAF5D8",
  border: "#5F7A35",
  solid: "#5F7A35",
  text: "#3B4D20",
};

// Tasarımın kendi ölçek adımları (4.4 / 8.8 / 13.2 / 17.6 / 26.4 / 35.2px) —
// en yakın tam piksele yuvarlandı.
export const spacing = {
  xs: 4,
  sm: 9,
  md: 13,
  lg: 18,
  xl: 26,
  xxl: 35,
};

export const radius = {
  sm: 8,
  md: 16,
  // Ekranlardaki somut .card yarıçapı (soyut token'daki 28 değil, gerçek
  // mockup'larda kullanılan 24) — piksel sadakati soyut token'dan önce gelir.
  lg: 24,
  pill: 999,
};

// Tipografi — tasarım kaynağında Caprasimo (başlık) sadece soyut
// design-system dokümantasyonunda tanımlı; GERÇEK ekranların HİÇBİRİNDE
// kullanılmıyor (hiçbir yerde <h1-h6> ya da font-heading uygulanmamış,
// hepsi Figtree ağırlık varyasyonlarıyla). Bu yüzden tüm uygulama tek
// fontta: Figtree (400/600/700).
export const fontFamily = {
  regular: "Figtree_400Regular",
  semibold: "Figtree_600SemiBold",
  bold: "Figtree_700Bold",
};

// Apple-tarzı tipografi ölçeği — hâlâ korunuyor (bileşenler arası tutarlı
// birkaç ölçü), ama artık varsayılan olarak Figtree_400Regular kullanıyor
// (fontWeight yerine fontFamily ile ifade ediliyor, RN'de custom font +
// fontWeight birlikte güvenilir çalışmayabiliyor).
export const type = {
  largeTitle: { fontFamily: fontFamily.bold, fontSize: 32, letterSpacing: -0.8 },
  title1: { fontFamily: fontFamily.bold, fontSize: 24, letterSpacing: -0.5 },
  title2: { fontFamily: fontFamily.semibold, fontSize: 19, letterSpacing: -0.3 },
  headline: { fontFamily: fontFamily.semibold, fontSize: 16, letterSpacing: -0.2 },
  body: { fontFamily: fontFamily.regular, fontSize: 15 },
  subhead: { fontFamily: fontFamily.semibold, fontSize: 14 },
  footnote: { fontFamily: fontFamily.regular, fontSize: 13 },
  caption: { fontFamily: fontFamily.semibold, fontSize: 11, letterSpacing: 0.2 },
};

export const shadows = {
  // Ekranlardaki somut .card gölgesi: "0 1px 2px rgba(46,43,37,.08), 0 0 0
  // 1px rgba(32,30,29,.04)" — RN çoklu box-shadow desteklemediği için tek
  // yumuşak gölge + ince hairline border ile aynı derinlik taklit ediliyor
  // (border ayrıca component style'ında ekleniyor).
  card: {
    shadowColor: "#2E2B25",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  // CTA/pill butonlar: "0 10px 22px -12px rgba(198,113,57,.9)" gibi renkli,
  // belirgin gölgeler.
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  }),
  // Premium banner / splash ikon karesi gibi daha büyük, koyu gölgeler.
  lifted: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  }),
};
