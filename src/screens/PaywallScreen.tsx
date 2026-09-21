import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import {
  colors,
  spacing,
  radius,
  fontFamily,
  shadows,
  good,
  accent as accentRamp,
  primaryGradient,
  primaryGradientLocations,
} from "../theme";
import {
  StarIcon,
  CloseIcon,
  CheckIcon,
  CameraIcon,
  AlertTriangleIcon,
  UserIcon,
  HistoryIcon,
  FlashIcon,
} from "../components/Icon";
import { TIERS, DEFAULT_TIER_ID, TierId, ADDON, getTier } from "../utils/plans";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

// Tasarım kaynağı: "11 Premium (paywall)" ekranı (9 Eylül 2026, kullanıcının
// Claude Design export'undan). Tasarımda aylık/yıllık iki plan seçeneği
// vardı.
//
// 12 Eylül değişikliği (kullanıcı: "farklı farklı premium paketler koyalım,
// isimler farklı olsun"): aylık/yıllık ikilisi yerine artık DÖRT paket var
// (Başlangıç/Pro/Premium — bkz. plans.ts > TIERS), her biri kendi aylık
// tarama KOTASIYLA. Bu yüzden "Sınırsız analiz" vaadi de ARTIK DOĞRU DEĞİL
// — kaldırıldı. Aşağıdaki minTarama/maxTarama, TIERS'ten otomatik
// hesaplanıyor ki paket kotaları değişince bu metin de otomatik güncellensin.
const minTarama = Math.min(...TIERS.map((t) => t.scansPerMonth));
const maxTarama = Math.max(...TIERS.map((t) => t.scansPerMonth));

// 9 Eylül düzeltmesi (2. tur — kullanıcı: "biraz daha yazılar yazsın, sade
// kalmasın, ikna edici örnekler olsun"): ÖNEMLİ bir doğruluk sorunu da
// bununla birlikte düzeltildi. Eski FEATURES listesindeki 4 maddeden
// SADECE 2'si gerçekten Premium'a özel (bkz. kod tabanındaki TEK 2 gerçek
// kilit: SubscriptionContext > canScan/scan limiti, ve HistoryScreen'deki
// karşılaştırma modu). "Derin bileşen raporu" ve "Alerjen uyarıları" ise
// ZATEN ücretsiz kullanıcıya da gösteriliyor (ResultScreen ve
// personalizedNote hiçbir premium kontrolüne bağlı değil) — yani Premium
// vaadi olarak listelemek yanıltıcıydı. Aşağıda SADECE gerçek 2 kilidi
// (canlı örneklerle, ikna edici şekilde) vurguluyoruz; "zaten her zaman
// ücretsiz" olan güçlü yanları ise ayrı bir güven kutusunda, dürüstçe
// "bunlar bile ücretsizde bu kadar iyi, kotan artınca düşün" mantığıyla yine
// ikna edici bir şekilde kullanıyoruz.
const FEATURES = [
  {
    title: "Çok daha yüksek tarama hakkı",
    desc: `Ücretsiz planda ayda 3 taramadan sonra kilitlenirsin. Premium paketlerde ayda ${minTarama}'den ${maxTarama}'e kadar tarama hakkın olur — hangisinin sana yettiğini aşağıdan seç.`,
  },
  {
    title: "Sınırsız karşılaştırma",
    desc: "\"Bu nemlendirici mi daha iyi, yoksa eskisi mi?\" İki taramanı yan yana koy, bileşen bileşen farkı gör — hangi pakette olursan ol, dilediğin kadar.",
  },
];

// Bu ikisi PREMIUM'A ÖZEL DEĞİL — ücretsiz kullanıcı da alıyor. Burada
// bilerek "Premium avantajı" gibi değil, "zaten böylesine iyi olan bir
// uygulamanın sınırsız hâli ne kadar işine yarar" çerçevesiyle kullanılıyor.
const ALWAYS_FREE = [
  "Her bileşen için ayrıntılı, anlaşılır açıklama",
  "Cilt/saç tipine ve alerjilerine özel değerlendirme",
];

// 9 Eylül düzeltmesi (3. tur — kullanıcı: "o örnek kısmını değiştirelim,
// kullanıcıya sunacağımız hizmetleri ön plana koyalım"): eski "exampleCard"
// tek bir senaryo anlatıyordu ("bu ay şampuanını... taradın"). Bunun yerine
// özünde'nin GERÇEKTEN sunduğu 4 temel hizmeti (hepsi ücretsiz planda da
// var — bkz. yukarıdaki ALWAYS_FREE/FEATURES notları) somut şekilde
// listeliyoruz; kapanışta bunu Premium'un GERÇEK vaadine (sınırsız
// kullanım) bağlıyoruz. Yanıltıcı olmaması için hiçbiri "sadece Premium'da"
// diye sunulmuyor.
const SERVICES = [
  { icon: CameraIcon, title: "Fotoğraf veya barkodla anında tara", desc: "Ürünün içerik listesini fotoğrafla — AI saniyeler içinde analiz etsin." },
  { icon: AlertTriangleIcon, title: "Bileşen bazlı risk & fayda analizi", desc: "Her bileşenin neden riskli, dikkat gerektiren ya da faydalı olduğunu anlaşılır dille öğren." },
  { icon: UserIcon, title: "Sana özel değerlendirme", desc: "Cilt/saç tipin ve alerjilerine göre kişiselleştirilmiş bir not al." },
  { icon: HistoryIcon, title: "Ürünleri yan yana karşılaştır", desc: "İki taramanı karşılaştır, hangisinin sana daha uygun olduğunu gör." },
];

export default function PaywallScreen({ navigation }: Props) {
  // 12 Eylül değişikliği: aylık/yıllık ikilisi yerine artık dört paketten biri
  // seçiliyor (bkz. plans.ts > TIERS). Varsayılan olarak en dengeli paket
  // (DEFAULT_TIER_ID = "pro") seçili geliyor.
  const [selectedTierId, setSelectedTierId] = useState<TierId>(DEFAULT_TIER_ID);

  // 9 Eylül düzeltmesi: eskiden bu buton doğrudan activatePremium() çağırıp
  // bir Alert gösteriyordu. Artık tasarımdaki "12 Ödeme" / "I Ödeme başarılı"
  // akışına uyarak önce Payment ekranına gidiyor — gerçek abone etme işlemi
  // (activatePremium) orada, kullanıcı "öde ve başla"ya bastığında gerçekleşiyor.
  const handleSubscribe = () => {
    navigation.navigate("Payment", { kind: "tier", tierId: selectedTierId });
  };

  // 12 Eylül eklemesi: abonelik istemeyen ama bir kaç ekstra taramaya
  // ihtiyacı olan kullanıcılar için — tek seferlik ek tarama paketi.
  const handleBuyAddon = () => {
    navigation.navigate("Payment", { kind: "addon" });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} activeOpacity={0.8}>
          <CloseIcon size={15} color="rgba(32,30,29,0.5)" />
        </TouchableOpacity>

        <View style={styles.iconBadge}>
          <StarIcon size={30} color="#F0C79A" strokeWidth={2.75} />
        </View>

        <Text style={styles.title}>Premium</Text>
        <Text style={styles.subtitle}>
          Ücretsiz planda ayda 3 ürün deneme hakkın var. Premium paketlerden biriyle ayda {minTarama}-{maxTarama}
          {" "}taramaya kadar hakkın olur, ürünlerini karşılaştırmak da dahil olmak üzere özünde'yi çok daha geniş
          kullanırsın.
        </Text>

        <View style={styles.featureCard}>
          {FEATURES.map((f, idx) => (
            <View key={f.title} style={[styles.featureRow, idx < FEATURES.length - 1 && styles.featureRowDivider]}>
              <View style={styles.featureDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.servicesCard}>
          <Text style={styles.servicesKicker}>özünde ile neler yapabilirsin</Text>
          {SERVICES.map((s, idx) => {
            const Icon = s.icon;
            return (
              <View key={s.title} style={[styles.serviceRow, idx < SERVICES.length - 1 && styles.featureRowDivider]}>
                <View style={styles.serviceIconWrap}>
                  <Icon size={15} color={colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceTitle}>{s.title}</Text>
                  <Text style={styles.serviceDesc}>{s.desc}</Text>
                </View>
              </View>
            );
          })}
          <Text style={styles.servicesNote}>
            Bunların hepsi özünde'nin sunduğu hizmetler. Premium, bunları çok daha geniş bir aylık kotayla
            kullanmanı sağlıyor.
          </Text>
        </View>

        <View style={styles.alwaysFreeCard}>
          <Text style={styles.alwaysFreeTitle}>Zaten ücretsiz planda bile bunlar var</Text>
          {ALWAYS_FREE.map((t) => (
            <View key={t} style={styles.alwaysFreeRow}>
              <CheckIcon size={12} color={colors.secondary} strokeWidth={3} />
              <Text style={styles.alwaysFreeText}>{t}</Text>
            </View>
          ))}
          <Text style={styles.alwaysFreeNote}>
            Temel analiz zaten bu kadar özenliyse, kotan artınca sana ne kadar işe yarayacağını bir düşün.
          </Text>
        </View>

        {/* 12 Eylül değişikliği: aylık/yıllık ikilisi yerine dört paketten biri
            seçiliyor (bkz. plans.ts > TIERS). Dikey liste — 3 kart + rozet +
            tagline yan yana sıkışınca dar ekranlarda okunaksız oluyordu. */}
        <View style={styles.tierList}>
          {TIERS.map((tier) => (
            <TierOption
              key={tier.id}
              tier={tier}
              selected={selectedTierId === tier.id}
              onPress={() => setSelectedTierId(tier.id)}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleSubscribe} activeOpacity={0.9}>
          <LinearGradient
            colors={primaryGradient}
            locations={primaryGradientLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subscribeBtn}
          >
            <Text style={styles.subscribeBtnText}>{getTier(selectedTierId).name} paketine geç</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 12 Eylül eklemesi: abonelik istemeyenler için tek seferlik ek
            tarama paketine düşük vurgulu bir alternatif bağlantı. */}
        <TouchableOpacity onPress={handleBuyAddon} activeOpacity={0.7} style={styles.addonLink}>
          <Text style={styles.addonLinkText}>
            Sadece birkaç tarama mı lazım? Abone olmadan <Text style={styles.addonLinkStrong}>{ADDON.name}</Text> al
            ({ADDON.priceLabel}, {ADDON.extraScans} tarama)
          </Text>
        </TouchableOpacity>

        <Text style={styles.demoNote}>
          Ücretsiz planda 3 ürün deneme hakkın var. Aboneliği dilediğin zaman iptal edebilirsin.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function TierOption({
  tier,
  selected,
  onPress,
}: {
  tier: (typeof TIERS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const content = (
    <>
      <View style={styles.tierHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tierName, selected && styles.tierNameSelected]}>{tier.name}</Text>
          <Text style={[styles.tierTagline, selected && styles.tierTaglineSelected]}>{tier.tagline}</Text>
        </View>
        {tier.badge && (
          <View style={styles.tierBadge}>
            <FlashIcon size={10} color="#fff" />
            <Text style={styles.tierBadgeText}>{tier.badge}</Text>
          </View>
        )}
      </View>
      <View style={[styles.tierFooterRow, selected && styles.tierFooterRowSelected]}>
        <Text style={[styles.tierQuota, selected && styles.tierQuotaSelected]}>
          Ayda <Text style={styles.tierQuotaNum}>{tier.scansPerMonth}</Text> tarama
        </Text>
        <Text style={[styles.tierPrice, selected && styles.tierPriceSelected]}>{tier.priceLabel}/ay</Text>
      </View>
    </>
  );

  if (!selected) {
    return (
      <TouchableOpacity style={styles.tierOption} onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={primaryGradient}
        locations={primaryGradientLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.tierOption, styles.tierOptionSelected]}
      >
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  closeBtn: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primaryDarker,
    // Tasarım kaynağı: linear-gradient(150deg,#2F2A26,#8C491A) — RN'de tek
    // renk bir zemine en yakın koyu tonu (primaryDarker) kullanıyoruz, asıl
    // "canlı" his zaten diğer ekranlardaki gradyanlarda var.
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.lifted("#2E2B25"),
  },
  title: { fontFamily: fontFamily.semibold, fontSize: 25, letterSpacing: -0.7, color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: 11.5, lineHeight: 18, marginTop: 5, marginBottom: spacing.lg },
  featureCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 9 },
  featureRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  featureDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: good.border, marginTop: 5 },
  featureTitle: { color: colors.text, fontSize: 13, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  featureDesc: { color: colors.textFaint, fontSize: 10.5, marginTop: 3, lineHeight: 15 },
  servicesCard: {
    backgroundColor: accentRamp[100],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: accentRamp[300],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  servicesKicker: {
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: fontFamily.bold,
    color: colors.primaryDark,
    marginBottom: 8,
  },
  serviceRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8 },
  serviceIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  serviceTitle: { color: colors.text, fontSize: 12.5, fontFamily: fontFamily.semibold, letterSpacing: -0.1 },
  serviceDesc: { color: colors.textFaint, fontSize: 10.5, marginTop: 2, lineHeight: 15 },
  servicesNote: { color: colors.primaryDark, fontSize: 11, lineHeight: 16, marginTop: 8, fontFamily: fontFamily.semibold },
  alwaysFreeCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alwaysFreeTitle: { color: colors.text, fontSize: 11.5, fontFamily: fontFamily.semibold, marginBottom: 7 },
  alwaysFreeRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 5 },
  alwaysFreeText: { color: colors.textMuted, fontSize: 11, flex: 1 },
  alwaysFreeNote: { color: colors.textFaint, fontSize: 10, lineHeight: 15, marginTop: 4, fontStyle: "italic" },
  tierList: { gap: spacing.sm, marginBottom: spacing.md },
  tierOption: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.cardAlt,
    padding: spacing.md,
    position: "relative",
  },
  tierOptionSelected: {
    borderWidth: 0,
    ...shadows.glow(colors.primaryDarker),
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tierHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  tierName: { color: colors.text, fontSize: 14.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  tierNameSelected: { color: "#fff" },
  tierTagline: { color: colors.textFaint, fontSize: 10.5, marginTop: 2 },
  tierTaglineSelected: { color: "rgba(255,255,255,0.75)" },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: good.solid,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  tierBadgeText: { color: "#fff", fontSize: 9, fontFamily: fontFamily.bold },
  tierFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  tierFooterRowSelected: { borderTopColor: "rgba(255,255,255,0.22)" },
  tierQuota: { color: colors.textMuted, fontSize: 11.5 },
  tierQuotaSelected: { color: "rgba(255,255,255,0.85)" },
  tierQuotaNum: { fontFamily: fontFamily.bold },
  tierPrice: { color: colors.text, fontSize: 16, fontFamily: fontFamily.bold, letterSpacing: -0.3 },
  tierPriceSelected: { color: "#fff" },
  addonLink: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  addonLinkText: { color: colors.textMuted, fontSize: 11.5, lineHeight: 16, textAlign: "center" },
  addonLinkStrong: { color: colors.primaryDark, fontFamily: fontFamily.semibold },
  subscribeBtn: {
    borderRadius: radius.pill,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow(colors.primaryDark),
  },
  subscribeBtnText: { color: "#fff", fontFamily: fontFamily.semibold, fontSize: 14.5, letterSpacing: -0.2 },
  demoNote: { color: colors.textFaint, fontSize: 10, textAlign: "center", marginTop: spacing.md, lineHeight: 15 },
});
