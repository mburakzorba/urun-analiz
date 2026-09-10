import type { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProductAnalysis } from "../types";

// Ana Sayfa/Geçmiş/Profil artık alt sekme (bottom tab) — Claude Design
// canvas'ındaki marka kimliği mockup'ında olduğu gibi, ortada kamera FAB'ı
// olan bir sekme çubuğu. Bu üçü kendi ParamList'inde, kalan ekranlar
// (Scan/Analyzing/Result/Paywall/Compare) hâlâ kök stack'te — tam ekran
// modal/push olarak sekmelerin ÜZERİNE açılıyorlar.
export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  // 7 Eylül düzeltmesi: eskiden "undefined" idi — bu, kök stack'teki bir
  // ekrandan (ör. Result) doğrudan alt sekmelerden birine (ör. Profil)
  // yönlendirme yapmayı (navigation.navigate("MainTabs", { screen: "Profile" }))
  // TİP OLARAK imkansız kılıyordu. NavigatorScreenParams sarmalayıcısı hem
  // eski kullanımı (parametresiz navigate("MainTabs")) hem yeni, hedef
  // sekmeyi belirten kullanımı destekliyor.
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Scan: undefined;
  Analyzing: {
    imageUri: string;
    backImageUri?: string;
    barcode?: string;
    userProvidedName?: string;
    userProvidedIngredients?: string;
    userIntent?: string;
    bothImagesAreIngredients?: boolean;
  };
  // 10 Eylül düzeltmesi (kullanıcı geri bildirimi — "ürüne her girdiğimde
  // eklendi bildirimi geliyor, ilk analizden sonra gelmesin"): "eklendi"
  // toast'ı eskiden bu ekran her AÇILDIĞINDA (geçmişten/aramadan tekrar
  // açılsa bile) gösteriliyordu. justAnalyzed=true SADECE AnalyzingScreen'in
  // YENİ bir analiz bitirip buraya geçtiği tek yerde gönderiliyor — Geçmiş/
  // Arama/Ana Sayfa'daki "Son analizler" listesinden bir ürüne tekrar
  // girildiğinde bu alan hiç verilmiyor (undefined → toast gösterilmez).
  Result: { analysis: ProductAnalysis; justAnalyzed?: boolean };
  Paywall: undefined;
  Compare: { a: ProductAnalysis; b: ProductAnalysis };
  // --- 9 Eylül eklemeleri: Claude Design export'undaki kalan ekranlar ---
  // Profil sekmesi artık bir MENÜ (bkz. yeni ProfileScreen, tasarım "10
  // Profil") — eski form (cilt/saç/alerji, tasarım "10b") buraya, kök
  // stack'te ayrı bir push edilen ekrana taşındı.
  ProfileEdit: undefined;
  Subscription: undefined;
  // 9 Eylül eklemesi: yıllık plan seçeneği — Paywall'da seçilen plan buraya
  // taşınıyor. "monthly"/"yearly" verilmezse (eski çağrılar) PaymentScreen
  // varsayılan olarak "monthly" kullanıyor.
  Payment: { interval?: "monthly" | "yearly" } | undefined;
  PaymentSuccess: undefined;
  Notifications: undefined;
  Settings: undefined;
  // analysis verilmişse (ör. Result ekranındaki "Sorun bildir"), o analiz
  // önceden seçili gelir; verilmezse kullanıcı geçmişinden seçer.
  ReportProblem: { analysis?: ProductAnalysis } | undefined;
  // 9 Eylül eklemesi: autoSent=true → backend'e otomatik POST ile gitti
  // (gerçek, ek adım yok); false/verilmezse → eski mailto: yedeğine düşüldü.
  // ReportSentScreen bu ikisi için farklı (ama her ikisi de doğru) bir metin
  // gösteriyor.
  ReportSent: { autoSent: boolean } | undefined;
  Search: undefined;
  LimitReached: undefined;
};

// Home/History/Profile ekranları hem kendi sekme sırasında GEZİNMELİ (ör.
// navigation.navigate("History")) hem de kök stack'teki ekranlara ATLAYABİLMELİ
// (ör. navigation.navigate("Paywall"), navigation.navigate("Scan")) — bu
// yüzden düz BottomTabScreenProps yetmiyor, ikisini birleştiren bir
// CompositeScreenProps gerekiyor.
export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
