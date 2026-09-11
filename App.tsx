import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFonts,
  Figtree_400Regular,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from "@expo-google-fonts/figtree";

import { RootStackParamList } from "./src/navigation/types";
import MainTabs from "./src/navigation/MainTabs";
import { SubscriptionProvider } from "./src/context/SubscriptionContext";
import { HistoryProvider } from "./src/context/HistoryContext";
import { UserProfileProvider } from "./src/context/UserProfileContext";
import { colors } from "./src/theme";
import { MascotIcon } from "./src/components/Icon";

import OnboardingScreen, { ONBOARDING_KEY } from "./src/screens/OnboardingScreen";
import ScanScreen from "./src/screens/ScanScreen";
import AnalyzingScreen from "./src/screens/AnalyzingScreen";
import ResultScreen from "./src/screens/ResultScreen";
import PaywallScreen from "./src/screens/PaywallScreen";
import CompareScreen from "./src/screens/CompareScreen";
// --- 9 Eylül eklemeleri: "kalan tasarımlar" turunda eklenen ekranlar ---
import ProfileEditScreen from "./src/screens/ProfileEditScreen";
import SubscriptionScreen from "./src/screens/SubscriptionScreen";
import PaymentScreen from "./src/screens/PaymentScreen";
import PaymentSuccessScreen from "./src/screens/PaymentSuccessScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ReportProblemScreen from "./src/screens/ReportProblemScreen";
import ReportSentScreen from "./src/screens/ReportSentScreen";
import SearchScreen from "./src/screens/SearchScreen";
import LimitReachedScreen from "./src/screens/LimitReachedScreen";
// 10 Eylül eklemesi: tasarım "B Sonucu paylaş" — son eksik ekran.
import ShareResultScreen from "./src/screens/ShareResultScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // Onboarding'i daha önce gördüyse (AsyncStorage'da bayrak varsa) direkt
  // MainTabs'tan (Ana Sayfa sekmesi) başlat, yoksa (ilk açılış) önce
  // Onboarding'i göster. Bu kontrol çok hızlı (tek bir AsyncStorage okuma)
  // ama yine de bir "an" sürdüğü için sonuç gelene kadar boş bir ekran
  // gösteriyoruz — beyaz/koyu flaş olmasın.
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  // "özünde" marka kimliği tamamen Figtree kullanıyor (bkz. theme.ts >
  // fontFamily) — ayrı bir başlık fontu yok. Fontlar yüklenene kadar sistem
  // fontuyla render etmek yerine kısa bir an bekliyoruz ki metinler font
  // değişince "atlamasın".
  const [fontsLoaded] = useFonts({ Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold });

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        setInitialRoute(seen ? "MainTabs" : "Onboarding");
      } catch {
        setInitialRoute("MainTabs");
      }
    })();
  }, []);

  if (!initialRoute || !fontsLoaded) {
    // 9 Eylül eklemesi: tasarım kaynağı "H Açılış" — fontlar/ilk kontrol
    // yüklenene kadar tamamen boş bir ekran yerine marka mascotu + adı
    // gösteriliyor artık. NOT: bu React Native tarafındaki (JS) yükleme
    // ekranı — cihazın kendi native splash ekranı (app.json > "splash",
    // varsa) bundan ÖNCE, JS hiç çalışmadan gösterilir; bu ikisi ayrı
    // şeylerdir ve burada native splash config'i değiştirilmiyor.
    return (
      <View style={splashStyles.container}>
        <MascotIcon size={48} color={colors.primary} />
        <Text style={splashStyles.title}>özünde</Text>
        <Text style={splashStyles.tagline}>Kişisel bakım ürünlerinin içeriğini çöz</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SubscriptionProvider>
          <HistoryProvider>
            <UserProfileProvider>
              <StatusBar style="dark" />
              <NavigationContainer>
                <Stack.Navigator
                  initialRouteName={initialRoute}
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.bg },
                  }}
                >
                  <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                  <Stack.Screen name="MainTabs" component={MainTabs} />
                  <Stack.Screen name="Scan" component={ScanScreen} options={{ presentation: "fullScreenModal" }} />
                  <Stack.Screen name="Analyzing" component={AnalyzingScreen} />
                  <Stack.Screen name="Result" component={ResultScreen} />
                  <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: "modal" }} />
                  <Stack.Screen name="Compare" component={CompareScreen} />
                  {/* --- 9 Eylül eklemeleri --- */}
                  <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
                  <Stack.Screen name="Subscription" component={SubscriptionScreen} />
                  {/* 9 Eylül düzeltmesi: "presentation: modal" KALDIRILDI —
                      Payment zaten Paywall'ın (modal) İÇİNDEN push ediliyor;
                      onu da ayrıca modal yapmak iOS'ta modal-içinde-modal
                      (iç içe sheet) gibi garip/"sekme sekme" görünen bir
                      geçişe yol açıyordu. Artık Paywall→Payment→PaymentSuccess
                      TEK, sürekli bir sheet akışı. */}
                  <Stack.Screen name="Payment" component={PaymentScreen} />
                  <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
                  <Stack.Screen name="Notifications" component={NotificationsScreen} />
                  <Stack.Screen name="Settings" component={SettingsScreen} />
                  <Stack.Screen name="ReportProblem" component={ReportProblemScreen} />
                  <Stack.Screen name="ReportSent" component={ReportSentScreen} />
                  <Stack.Screen name="Search" component={SearchScreen} options={{ presentation: "fullScreenModal" }} />
                  <Stack.Screen name="LimitReached" component={LimitReachedScreen} options={{ presentation: "modal" }} />
                  {/* 10 Eylül eklemesi: Sonuç ekranındaki "Paylaş"ın açtığı,
                      görsel paylaşım kartı önizleme ekranı — Paywall gibi bir
                      "sheet" hissi için modal. */}
                  <Stack.Screen name="ShareResult" component={ShareResultScreen} options={{ presentation: "modal" }} />
                </Stack.Navigator>
              </NavigationContainer>
            </UserProfileProvider>
          </HistoryProvider>
        </SubscriptionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// NOT: bu ekran fontlar YÜKLENMEDEN ÖNCE gösteriliyor (bkz. yukarıdaki
// "if (!fontsLoaded)" kontrolü) — yani Figtree henüz kullanılamaz. Kasıtlı
// olarak fontFamily VERMİYORUZ (sistem fontuyla render edilsin); aksi halde
// bu ekran sistem fontuyla başlar, hemen ardından Figtree yüklenince
// bir sonraki ekran farklı fontla açılır — tam da dosyanın en üstündeki
// "metinler font değişince atlamasın" notunun önlemeye çalıştığı sıçrama.
const splashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.6, color: colors.text, marginTop: 8 },
  tagline: { fontSize: 12.5, color: colors.textMuted },
});
