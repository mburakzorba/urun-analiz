import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { RootStackParamList } from "./src/navigation/types";
import { SubscriptionProvider } from "./src/context/SubscriptionContext";
import { HistoryProvider } from "./src/context/HistoryContext";
import { colors } from "./src/theme";

import HomeScreen from "./src/screens/HomeScreen";
import ScanScreen from "./src/screens/ScanScreen";
import AnalyzingScreen from "./src/screens/AnalyzingScreen";
import ResultScreen from "./src/screens/ResultScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import PaywallScreen from "./src/screens/PaywallScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SubscriptionProvider>
          <HistoryProvider>
            <StatusBar style="light" />
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg },
                }}
              >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Scan" component={ScanScreen} options={{ presentation: "fullScreenModal" }} />
                <Stack.Screen name="Analyzing" component={AnalyzingScreen} />
                <Stack.Screen name="Result" component={ResultScreen} />
                <Stack.Screen name="History" component={HistoryScreen} />
                <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: "modal" }} />
              </Stack.Navigator>
            </NavigationContainer>
          </HistoryProvider>
        </SubscriptionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
