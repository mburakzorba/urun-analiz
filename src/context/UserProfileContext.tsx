import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile, EMPTY_USER_PROFILE } from "../types";

const STORAGE_KEY = "urun-analiz:userProfile";

interface UserProfileContextValue {
  profile: UserProfile;
  loading: boolean;
  // Profil hiç doldurulmamışsa (completedAt yok) true — HomeScreen'de
  // "profilini tamamla" hatırlatıcısını göstermek için kullanılır.
  isProfileEmpty: boolean;
  saveProfile: (next: UserProfile) => Promise<void>;
  clearProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_USER_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setProfile(JSON.parse(raw));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProfile = useCallback(async (next: UserProfile) => {
    const withTimestamp: UserProfile = { ...next, completedAt: next.completedAt || new Date().toISOString() };
    setProfile(withTimestamp);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
  }, []);

  const clearProfile = useCallback(async () => {
    setProfile(EMPTY_USER_PROFILE);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const isProfileEmpty = !profile.completedAt;

  return (
    <UserProfileContext.Provider value={{ profile, loading, isProfileEmpty, saveProfile, clearProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile, UserProfileProvider içinde kullanılmalı");
  return ctx;
}