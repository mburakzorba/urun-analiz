import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SubscriptionState } from "../types";

const STORAGE_KEY = "urun-analiz:subscription";
const FREE_SCANS_LIMIT = 3; // Aylık ücretsiz tarama hakkı

function startOfCurrentMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

const DEFAULT_STATE: SubscriptionState = {
  isPremium: false,
  freeScansUsedThisMonth: 0,
  freeScansLimit: FREE_SCANS_LIMIT,
  currentPeriodStart: startOfCurrentMonthISO(),
};

interface SubscriptionContextValue {
  state: SubscriptionState;
  loading: boolean;
  canScan: boolean;
  remainingFreeScans: number;
  registerScan: () => Promise<void>;
  activatePremium: () => Promise<void>;
  cancelPremium: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          let parsed: SubscriptionState = JSON.parse(raw);
          // Yeni ay başladıysa ücretsiz hakları sıfırla
          if (parsed.currentPeriodStart !== startOfCurrentMonthISO()) {
            parsed = {
              ...parsed,
              freeScansUsedThisMonth: 0,
              currentPeriodStart: startOfCurrentMonthISO(),
            };
          }
          setState(parsed);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: SubscriptionState) => {
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const registerScan = useCallback(async () => {
    if (state.isPremium) return; // Premium kullanıcı için sınır yok
    await persist({ ...state, freeScansUsedThisMonth: state.freeScansUsedThisMonth + 1 });
  }, [state, persist]);

  const activatePremium = useCallback(async () => {
    // NOT: Bu demo amaçlı yerel bir "premium" bayrağıdır.
    // Gerçek ödeme akışı için README.md > "Abonelik / Ödeme Entegrasyonu" bölümüne bakın
    // (RevenueCat + App Store / Play Store abonelik ürünleri önerilir).
    await persist({ ...state, isPremium: true });
  }, [state, persist]);

  const cancelPremium = useCallback(async () => {
    await persist({ ...state, isPremium: false });
  }, [state, persist]);

  const remainingFreeScans = Math.max(0, state.freeScansLimit - state.freeScansUsedThisMonth);
  const canScan = state.isPremium || remainingFreeScans > 0;

  return (
    <SubscriptionContext.Provider
      value={{ state, loading, canScan, remainingFreeScans, registerScan, activatePremium, cancelPremium }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription, SubscriptionProvider içinde kullanılmalı");
  return ctx;
}
