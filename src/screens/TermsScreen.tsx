import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily } from "../theme";
import { ChevronLeft } from "../components/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "Terms">;

// 16 Eylül eklemesi: SettingsScreen'deki "Kullanım koşulları" artık burayı
// açıyor (öncesinde "yakında" diyen sahte bir buton vardı).
//
// ÖNEMLİ (yusuf için, uygulama içinde GÖRÜNMÜYOR): bu metin taslak olarak
// yazıldı — hukuki bir belge. Yayına almadan önce (özellikle abonelik/
// otomatik yenileme ve KVKK/veri işleme kısımlarını) bir avukata kontrol
// ettirmen önerilir.
const LAST_UPDATED = "16 Eylül 2026";
const CONTACT_EMAIL = "destek.ozunde@gmail.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

export default function TermsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
          <ChevronLeft size={15} color={colors.primaryDark} />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Kullanım koşulları</Text>
        <Text style={styles.updatedText}>Son güncelleme: {LAST_UPDATED}</Text>

        <Section title="1. Kabul">
          özünde uygulamasını ("Uygulama") indirerek, hesap oluşturarak veya kullanarak bu Kullanım Koşulları'nı kabul
          etmiş olursun. Koşulları kabul etmiyorsan Uygulamayı kullanmamalısın.
        </Section>

        <Section title="2. Uygulama ne yapar">
          özünde, yüklediğin bir ürün fotoğrafından/etiketinden yapay zekâ ile içerik analizi yapar ve sana genel bir
          değerlendirme (etkinlik, sağlık skoru, bileşen bazlı risk değerlendirmesi gibi) sunar. Bu değerlendirmeler
          otomatik olarak üretilir ve yalnızca bilgilendirme amaçlıdır.
        </Section>

        <Section title="3. Tıbbi/profesyonel tavsiye değildir">
          Uygulamadaki hiçbir içerik tıbbi, dermatolojik, eczacılık veya benzeri bir profesyonel tavsiye YERİNE
          GEÇMEZ. Bir bileşenle ilgili alerjin, hassasiyetin veya sağlık durumunla ilgili endişen varsa bir doktora
          veya uzmana danış. Yapay zekâ analizleri hatalı, eksik veya güncel olmayan sonuçlar üretebilir; hiçbir
          ürünü sadece Uygulamadaki sonuca bakarak kullanıp kullanmamaya karar vermemelisin.
        </Section>

        <Section title="4. Hesap oluşturma">
          Hesap oluşturmak zorunlu değildir — Uygulamanın çoğu özelliği hesapsız da çalışır. Hesap oluşturursan
          (e-posta/şifre veya Google ile) doğru ve güncel bilgi vermekle, hesabının güvenliğinden (şifreni gizli
          tutmaktan) sorumlusun. Hesabınla ilgili şüpheli bir durum fark edersen bizimle iletişime geç.
        </Section>

        <Section title="5. Abonelik ve ödemeler">
          Uygulama içinde ücretli paketler (aylık tarama kotası) ve tek seferlik ek tarama paketleri sunulabilir.
          Ücretli bir paket satın aldığında, satın alma uygulama mağazasının (App Store/Google Play) kendi ödeme ve
          abonelik altyapısı üzerinden gerçekleşir; abonelikler aksi belirtilmedikçe otomatik yenilenir. Aboneliğini
          istediğin zaman ilgili mağaza uygulamasından iptal edebilirsin — iptal, mevcut ödeme döneminin sonuna kadar
          erişimini etkilemez. İadeler, ilgili mağazanın kendi iade politikasına tabidir; özünde doğrudan ödeme
          bilgini görmez veya saklamaz.
        </Section>

        <Section title="6. Kabul edilebilir kullanım">
          Uygulamayı yasa dışı bir amaçla, başkalarının haklarını ihlal edecek şekilde, Uygulamanın altyapısına zarar
          verecek veya orantısız yük bindirecek şekilde (ör. otomatik/toplu istek göndererek) kullanmamayı kabul
          edersin.
        </Section>

        <Section title="7. İçerik ve fikri mülkiyet">
          Uygulamanın tasarımı, markası ve yazılımı özünde'ye aittir. Taradığın ürünlere ait fotoğraflar/etiketler
          kendi sorumluluğundadır; bu içerikleri yalnızca analiz hizmetini sağlamak amacıyla işleriz (bkz. Gizlilik
          Politikası).
        </Section>

        <Section title="8. Sorumluluğun sınırlanması">
          Uygulama "olduğu gibi" sunulur. Yasaların izin verdiği azami ölçüde, Uygulamanın kullanımından doğabilecek
          dolaylı, arızi veya sonuç niteliğindeki zararlardan (ör. yanlış bir analiz sonucuna dayanarak alınan bir
          karardan doğan zarar) sorumlu değiliz.
        </Section>

        <Section title="9. Hesap silme ve fesih">
          Hesabını, Ayarlar ekranından istediğin zaman kalıcı olarak silebilirsin. Kullanım koşullarını ihlal etmen
          durumunda hesabına erişimini askıya alabilir veya sonlandırabiliriz.
        </Section>

        <Section title="10. Değişiklikler">
          Bu koşulları zaman zaman güncelleyebiliriz. Önemli değişikliklerde Uygulama içinden bilgilendirme
          yapmaya çalışırız. Güncelleme sonrası Uygulamayı kullanmaya devam etmen, yeni koşulları kabul ettiğin
          anlamına gelir.
        </Section>

        <Section title="11. Uygulanacak hukuk">
          Bu koşullar Türkiye Cumhuriyeti kanunlarına tabidir.
        </Section>

        <Section title="12. İletişim">
          Sorularınız için: {CONTACT_EMAIL}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.md },
  backText: { color: colors.primaryDark, fontSize: 13.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: -0.6, color: colors.text, marginBottom: 4 },
  updatedText: { color: colors.textFaint, fontSize: 11, marginBottom: spacing.lg },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 13.5, fontFamily: fontFamily.semibold, marginBottom: 8 },
  sectionBody: { color: colors.textMuted, fontSize: 12.5, lineHeight: 19 },
});
