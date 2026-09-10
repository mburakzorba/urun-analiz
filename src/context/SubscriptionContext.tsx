import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SubscriptionState } from "../types";

const STORAGE_KEY = "urun-analiz:subscription";
const FREE_SCANS_LIMIT = 3; // Aylık ücretsiz tarama hakkı

// --- FİYAT/LİMİT MANTIĞI — GERÇEK MALİYETE GÖRE AYARLANDI (19 Ağustos 2026) ---
// Render loglarındaki gerçek [analyze][maliyet] verisine göre bir tarama
// ortalama ~$0.08 (Claude Sonnet 5, girdi+çıktı+cache dahil). ₺49,99/ay eski
// fiyatla (~$1,04) bir Premium kullanıcı ayda ~13 taramadan fazla yaparsa
// zaten zarar ediyorduk — eski PREMIUM_FAIR_USE_LIMIT (80) bu riski
// büyütüyordu (80 tarama ≈ $6,4 ≈ ₺310 maliyet, ₺49,99 gelire karşı).
// NOT: Bu hâlâ GERÇEK bir ödeme sistemi değil (activatePremium() yerel bir
// bayrak) — burada yapılan, ileride gerçek ödeme bağlandığında zarar
// etmeyecek şekilde sayıları önceden makul bir noktaya çekmek. Maliyet
// düşerse (ör. prompt kısalır, model ucuzlar) ya da fiyat stratejisi
// değişirse bu sabitler kolayca güncellenebilir.
// GEÇİCİ OLARAK YÜKSELTİLDİ (20 Ağustos 2026): sen şu an Haiku/prompt
// düzeltmelerini yoğun şekilde test ediyorsun ve gerçek ödeme sistemi henüz
// yok (activatePremium() yerel bir bayrak) — 30'luk gerçek-kullanıcı sınırı
// kendi testlerini bloklamaya başladı ("Yoğun kullanım tespit edildi").
// Test bittiğinde, hangi modelde (Sonnet/Haiku) kalacağımıza ve gerçek
// fiyat/limit stratejisine karar verince bunu tekrar gerçekçi bir sayıya
// (Haiku'nun gerçek ~₺0,90/tarama maliyetiyle, muhtemelen ~40-60 civarı)
// çekmemiz gerekiyor — kalıcı bir üretim değeri DEĞİL bu.
const PREMIUM_FAIR_USE_LIMIT = 300;

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
  // 9 Eylül eklemesi: yıllık plan seçeneği için parametreli — varsayılan
  // "monthly" (eski davranışla aynı, geriye dönük uyumlu).
  activatePremium: (interval?: "monthly" | "yearly") => Promise<void>;
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

  const activatePremium = useCallback(
    async (interval: "monthly" | "yearly" = "monthly") => {
      // NOT: Bu demo amaçlı yerel bir "premium" bayrağıdır.
      // Gerçek ödeme akışı için README.md > "Abonelik / Ödeme Entegrasyonu" bölümüne bakın
      // (RevenueCat + App Store / Play Store abonelik ürünleri önerilir).
      await persist({ ...state, isPremium: true, planInterval: interval, currentPeriodStart: startOfCurrentMonthISO() });
    },
    [state, persist]
  );

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
