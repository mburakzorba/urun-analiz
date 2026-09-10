import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, shadows, primaryGradient, primaryGradientLocations } from "../theme";
import { MainTabParamList } from "./types";
import { HomeIcon, HistoryIcon, UserIcon, CameraIcon } from "../components/Icon";

import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tasarımdaki ".tab/.tb/.fab" tab bar'ının birebir karşılığı: krem-tan
// degrade dolgulu, tam yuvarlak (pill) YÜZEN bir çubuk — kamera burada
// yükseltilmiş dairesel bir FAB DEĞİL, diğerleriyle aynı hizada, sadece
// "Tara" etiketiyle ayrışan normal bir sekme öğesi. Aktif sekme turuncu
// degrade dolgulu bir "chip" alıyor (bkz. .tb.on).
function TabItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  if (active) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.tabItemWrap} activeOpacity={0.85}>
        <LinearGradient
          colors={primaryGradient}
          locations={primaryGradientLocations}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.tabItemActive}
        >
          {icon}
          <Text style={styles.tabLabelActive}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tabItemWrap, styles.tabItem]} activeOpacity={0.7}>
      {icon}
      <Text style={styles.tabLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routeNames = state.routes.map((r) => r.name as keyof MainTabParamList);
  const activeName = routeNames[state.index];

  const goTo = (name: keyof MainTabParamList) => {
    const isFocused = activeName === name;
    const route = state.routes.find((r) => r.name === name)!;
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(name);
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <LinearGradient
        colors={["#FFF6EC", "#F6DEC4", "#E8C7A6", "#D9B08A"]}
        locations={[0, 0.38, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bar}
      >
        <TabItem
          icon={<HomeIcon size={19} color={activeName === "Home" ? "#fff" : "rgba(90,58,32,0.62)"} />}
          label="Ana Sayfa"
          active={activeName === "Home"}
          onPress={() => goTo("Home")}
        />
        <TabItem
          icon={<HistoryIcon size={19} color={activeName === "History" ? "#fff" : "rgba(90,58,32,0.62)"} />}
          label="Geçmiş"
          active={activeName === "History"}
          onPress={() => goTo("History")}
        />
        <TouchableOpacity
          style={[styles.tabItemWrap, styles.tabItem]}
          activeOpacity={0.7}
          onPress={() => navigation.getParent()?.navigate("Scan")}
          accessibilityRole="button"
          accessibilityLabel="Ürün Tara"
        >
          <CameraIcon size={19} color={colors.primaryDark} />
          <Text style={[styles.tabLabel, { color: colors.primaryDark }]}>Tara</Text>
        </TouchableOpacity>
        <TabItem
          icon={<UserIcon size={19} color={activeName === "Profile" ? "#fff" : "rgba(90,58,32,0.62)"} />}
          label="Profil"
          active={activeName === "Profile"}
          onPress={() => goTo("Profile")}
        />
      </LinearGradient>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 14, right: 14, bottom: 0, paddingTop: 4 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 6,
    borderRadius: 999,
    ...shadows.lifted("#2E2B25"),
  },
  tabItemWrap: { flex: 1, borderRadius: 999, overflow: "hidden" },
  tabItem: { alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 8 },
  tabItemActive: { alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 8, borderRadius: 999 },
  tabLabel: { fontSize: 8.5, fontWeight: "600", color: "rgba(90,58,32,0.62)", letterSpacing: -0.05 },
  tabLabelActive: { fontSize: 8.5, fontWeight: "600", color: "#fff", letterSpacing: -0.05 },
});
