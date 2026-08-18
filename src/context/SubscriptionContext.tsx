import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SubscriptionState } from "../types";

const STORAGE_KEY = "urun-analiz:subscription";
const FREE_SCANS_LIMIT = 3; // Aylık ücretsiz tarama hakkı

// "Âdil kullanım" (fair-use) sınırı — Premium kullanıcılar için PAZARLAMADA
// hiçbir yerde göstermiyoruz ("Sınırsız" diye satıyoruz), sadece anormal/
// aşırı kullanımı (bot, kötüye kullanım, ya da gerçekten ayda yüzlerce
// tarama yapan bir uç durum) yakalamak için arka planda duran bir güvenlik
// ağı. Sayı bilinçli olarak yüksek tutuldu (gerçek/normal kullanıcıların
// %99+'u bunun onda birine bile ulaşmaz) — amaç normal kullanıcıyı asla
// rahatsız etmemek, sadece marjı aşırı uçlardan korumak.
const PREMIUM_FAIR_USE_LIMIT = 80;

function startOfCurrentMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

const DEFAULT_STATE: SubscriptionState = {
  isPremium: false,
  scansUsedThisMonth: 0,
  freeScansLimit: FREE_SCANS_LIMIT,
  currentPeriodStart: startOfCurrentMonthISO(),
};

interface SubscriptionContextValue {
  state: SubscriptionState;
  loading: boolean;
  canScan: boolean;
  remainingFreeScans: number;
  // Premium bir kullanıcı âdil kullanım sınırına ulaştıysa true — HomeScreen
  // bu durumda Paywall'a değil, farklı (ve daha nazik) bir mesaja yönlendirir.
  premiumFairUseExceeded: boolean;
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
          // Yeni ay başladıysa hem ücretsiz hem âdil kullanım sayaçlarını sıfırla
          if (parsed.currentPeriodStart !== startOfCurrentMonthISO()) {
            parsed = {
              ...parsed,
              scansUsedThisMonth: 0,
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
    // Artık Premium kullanıcılar için de sayıyoruz (âdil kullanım takibi için) —
    // sadece ücretsiz plandaki gibi bunu ENGELLEMEK için kullanmıyoruz, sınır
    // çok daha yüksek (PREMIUM_FAIR_USE_LIMIT).
    await persist({ ...state, scansUsedThisMonth: state.scansUsedThisMonth + 1 });
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

  const remainingFreeScans = Math.max(0, state.freeScansLimit - state.scansUsedThisMonth);
  const premiumFairUseExceeded = state.isPremium && state.scansUsedThisMonth >= PREMIUM_FAIR_USE_LIMIT;
  const canScan = state.isPremium ? !premiumFairUseExceeded : remainingFreeScans > 0;

  return (
    <SubscriptionContext.Provider
      value={{
        state,
        loading,
        canScan,
        remainingFreeScans,
        premiumFairUseExceeded,
        registerScan,
        activatePremium,
        cancelPremium,
      }}
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