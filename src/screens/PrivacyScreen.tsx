import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily } from "../theme";
import { ChevronLeft } from "../components/Icon";

type Props = NativeStackScreenProps<RootStackParamList, "Privacy">;

// 16 Eylül eklemesi: SettingsScreen'deki "Gizlilik politikası" artık burayı
// açıyor (öncesinde "yakında" diyen sahte bir buton vardı). İçerik,
// uygulamanın GERÇEKTEN yaptığı şeylere göre yazıldı (bkz. server/src/index.js,
// SettingsScreen.tsx > handleExportData/handleDeleteData, AuthContext.tsx).
//
// ÖNEMLİ (yusuf için, uygulama içinde GÖRÜNMÜYOR): bu metin taslak — hukuki
// bir belge. Özellikle KVKK/veri işleme ve yurt dışına aktarım kısımlarını
// yayına almadan önce bir avukata kontrol ettirmen önerilir.
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

export default function PrivacyScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow} activeOpacity={0.7}>
          <ChevronLeft size={15} color={colors.primaryDark} />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Gizlilik politikası</Text>
        <Text style={styles.updatedText}>Son güncelleme: {LAST_UPDATED}</Text>

        <Section title="1. Hangi verileri topluyoruz">
          Ürün fotoğrafları: analiz için yüklediğin fotoğraflar, sonucu üretmek üzere sunucumuza ve oradan yapay
          zekâ sağlayıcımıza gönderilir — analiz tamamlandıktan sonra sunucumuzda SAKLANMAZ. Profil
          bilgileri (isteğe bağlı): cilt/saç tipi, alerjiler, yaş, cinsiyet gibi bilgiler cihazında tutulur; sadece
          o anki analizi kişiselleştirmek için istek sırasında gönderilir, ayrıca saklanmaz. Analiz geçmişin: cihazında
          tutulur, sunucularımıza yüklenmez. Hesap bilgilerin (hesap oluşturursan): e-posta adresin ve şifren (Google
          ile giriş yaptıysan Google hesabından gelen ad/e-posta/profil fotoğrafı), kimlik doğrulama sağlayıcımız
          tarafından tutulur. Sorun bildirimleri: "Sorun bildir" ile gönderdiğin açıklama ve varsa fotoğraf,
          e-posta yoluyla bize ulaştırılır.
        </Section>

        <Section title="2. Verilerini ne için kullanıyoruz">
          Ürün analizini üretmek, hesabına giriş yapabilmeni sağlamak, abonelik/kota durumunu yönetmek, gönderdiğin
          sorun bildirimlerine yanıt verebilmek ve Uygulamayı iyileştirmek için kullanıyoruz. Verilerini reklam
          amacıyla satmıyoruz veya üçüncü taraflara pazarlama amacıyla aktarmıyoruz.
        </Section>

        <Section title="3. Kiminle paylaşıyoruz (hizmet sağlayıcılarımız)">
          Verilerini, sana hizmet sunabilmemiz için gerekli olan şu alanlarda çalışan iş ortaklarımızla paylaşırız:
          yapay zekâ analiz hizmeti (ürün fotoğraflarını ve varsa profil bilgini analiz üretmek için işler), kimlik
          doğrulama hizmeti (hesap oluşturma/giriş altyapımızı sağlar, hesap bilgini tutar) ve e-posta iletim hizmeti
          ("Sorun bildir" e-postalarının iletilmesini sağlar). Bu iş ortaklarımız, verilerini SADECE bize hizmet
          sağlamak amacıyla, kendi gizlilik/güvenlik politikalarına tabi olarak işler. Verilerin, bu sağlayıcıların
          sunucularının bulunduğu ülkelere (Türkiye dışına) aktarılabileceğini bilmeni isteriz.
        </Section>

        <Section title="4. Ne kadar süre saklıyoruz">
          Ürün fotoğrafların, analiz tamamlanır tamamlanmaz sunucumuzdan silinir (saklanmaz). Aynı ürün adıyla
          yapılan analizler, maliyeti azaltmak için kısa süreli bir önbellekte (ürün adı + analiz sonucu, kişisel
          bilgi İÇERMEZ) tutulabilir. Hesap bilgilerin, hesabını silene kadar saklanır. Analiz geçmişin ve profil
          bilgilerin sadece cihazında tutulur — Ayarlar {"›"} "Verilerimi sil" ile istediğin an cihazından silebilirsin.
        </Section>

        <Section title="5. Haklarının (KVKK)">
          6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında; verilerinin işlenip işlenmediğini öğrenme,
          işlenmişse buna ilişkin bilgi talep etme, düzeltilmesini veya silinmesini isteme haklarına sahipsin. Avrupa
          Birliği'nde bulunuyorsan GDPR kapsamındaki haklarını da kullanabilirsin. Bu haklarını kullanmak için bizimle
          {" " + CONTACT_EMAIL + " "}
          adresinden iletişime geçebilirsin.
        </Section>

        <Section title="6. Hesabını silmek">
          Ayarlar {"›"} Hesap bölümünden hesabını istediğin zaman kalıcı olarak silebilirsin — bu işlem geri alınamaz ve
          hesap bilgilerini (e-posta, kimlik doğrulama kaydı) siler. Cihazında tuttuğun analiz geçmişi/profil bilgisi
          ayrı bir işlemdir (aynı ekranda "Verilerimi sil").
        </Section>

        <Section title="7. Güvenlik">
          Verilerini korumak için makul teknik ve idari önlemler alıyoruz (ör. şifreler bizim tarafımızda düz metin
          olarak tutulmaz, kimlik doğrulama sağlayıcımız üzerinden hash'lenerek saklanır). Ancak hiçbir sistem %100
          güvenli değildir.
        </Section>

        <Section title="8. Çocukların gizliliği">
          Uygulama 13 yaşından küçük çocuklara yönelik değildir ve bilerek onlardan veri toplamayız.
        </Section>

        <Section title="9. Değişiklikler">
          Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişikliklerde Uygulama içinden bilgilendirme yapmaya
          çalışırız.
        </Section>

        <Section title="10. İletişim">
          Gizlilikle ilgili sorular için: {CONTACT_EMAIL}
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
