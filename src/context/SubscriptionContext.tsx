import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";
import type { CustomerInfo } from "react-native-purchases";
import { SubscriptionState } from "../types";
import { TierId, getTier, DEFAULT_TIER_ID, ADDON } from "../utils/plans";
import {
  configurePurchases,
  getCustomerInfoSafe,
  addCustomerInfoListener,
  deriveTierFromCustomerInfo,
  purchaseTier as purchaseTierRC,
  purchaseAddonPack,
  getSubscriptionManagementUrl,
  restorePurchases as restorePurchasesRC,
  isUserCancelledError,
} from "../services/purchases";

const STORAGE_KEY = "urun-analiz:subscription";
const FREE_SCANS_LIMIT = 3; // Aylık ücretsiz tarama hakkı

// --- 21 Eylül değişikliği (RevenueCat entegrasyonu): bu dosya artık GERÇEK
// satın alma altyapısını kullanıyor (bkz. services/purchases.ts). Önemli
// mimari kararlar:
//
//  1. "isPremium" ve "tierId" artık burada ÜRETİLMİYOR/tutulmuyor — bunlar
//     her zaman RevenueCat'in CustomerInfo'sundan TÜRETİLİYOR
//     (deriveTierFromCustomerInfo). RevenueCat "tek doğru kaynak" — local
//     AsyncStorage'a yazılan isPremium/tierId sadece ekranlar ilk render'da
//     bir şey görsün diye tutulan bir ÖNBELLEK, asla otorite değil; her
//     mount'ta ve her RevenueCat değişikliğinde ezilir.
//  2. scansUsedThisMonth / freeScansLimit / currentPeriodStart / bonusScans /
//     bonusScansTotal — bunlar RevenueCat'in bilmediği, tamamen uygulamaya
//     özel kavramlar (kaç tarama hakkı kullanıldı) — hâlâ burada, local
//     AsyncStorage'da yönetiliyor, DEĞİŞMEDİ.
//  3. Paket DEĞİŞTİĞİNDE (yeni abonelik ya da farklı bir pakete geçiş) bu ayki
//     kota sayacı sıfırlanıyor — eskiden bunu activatePremium() çağrısı
//     yapıyordu; artık tierId RevenueCat'ten geldiği için bu, "türetilen
//     tierId, öncekinden farklı mı" kontrolüyle (applyCustomerInfo içinde)
//     yapılıyor — hem kullanıcı butona bastığında HEM DE arka planda (ör.
//     yenileme, Play Store'dan plan değişikliği) aynı şekilde çalışır.

function startOfCurrentMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

const DEFAULT_STATE: SubscriptionState = {
  isPremium: false,
  scansUsedThisMonth: 0,
  freeScansLimit: FREE_SCANS_LIMIT,
  currentPeriodStart: startOfCurrentMonthISO(),
  bonusScans: 0,
  bonusScansTotal: 0,
  processedAddonTransactionIds: [],
};

interface SubscriptionContextValue {
  state: SubscriptionState;
  loading: boolean;
  canScan: boolean;
  remainingFreeScans: number;
  remainingTierScans: number;
  tierQuotaExceeded: boolean;
  totalRemainingScans: number;
  registerScan: () => Promise<void>;
  // Artık gerçek bir Google Play satın alma akışı başlatır (bkz.
  // services/purchases.ts > purchaseTier). Kullanıcı satın alma sheet'ini
  // kapatırsa (vazgeçerse) sessizce döner; başka bir hata olursa fırlatır —
  // çağıran ekran (PaymentScreen) bunu yakalayıp kullanıcıya gösterir.
  activatePremium: (tierId: TierId) => Promise<void>;
  // Google Play Billing'de abonelik iptali uygulama içinden YAPILAMAZ —
  // bu fonksiyon artık Play Store'un abonelik yönetimi sayfasını açar.
  cancelPremium: () => Promise<void>;
  // Gerçek, tek seferlik satın alma akışı (bkz. purchaseAddonPack).
  purchaseAddon: () => Promise<void>;
  // Kullanıcı "satın alımlarımı geri yükle" isterse (ör. yeni cihaz/yeniden
  // kurulum) — RevenueCat'in kayıtlı satın alımlarını bu cihaza bağlar.
  restorePurchases: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(async (next: SubscriptionState) => {
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  // RevenueCat'ten gelen (ilk yükleme, satın alma sonrası veya arka plandaki
  // herhangi bir değişiklik — yenileme/iptal/plan değişikliği) bir
  // CustomerInfo'yu state'e uygular. Paket gerçekten değiştiyse (önceki
  // tierId'den farklıysa) bu ayki kota sayacını sıfırlar.
  const applyCustomerInfo = useCallback((info: CustomerInfo) => {
    const derived = deriveTierFromCustomerInfo(info);
    setState((prev) => {
      const tierChanged = derived.tierId !== prev.tierId;
      const next: SubscriptionState = {
        ...prev,
        isPremium: derived.isPremium,
        tierId: derived.tierId,
        ...(tierChanged && derived.isPremium
          ? { scansUsedThisMonth: 0, currentPeriodStart: startOfCurrentMonthISO() }
          : {}),
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    (async () => {
      let loaded: SubscriptionState = DEFAULT_STATE;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          let parsed: SubscriptionState = JSON.parse(raw);
          // Geriye dönük uyumluluk: eski kayıtlarda bu alanlar hiç yoktu —
          // eksik alanları güvenli varsayılanlarla dolduruyoruz.
          if (typeof parsed.bonusScans !== "number") parsed = { ...parsed, bonusScans: 0 };
          if (typeof parsed.bonusScansTotal !== "number") {
            parsed = { ...parsed, bonusScansTotal: parsed.bonusScans };
          }
          if (!Array.isArray(parsed.processedAddonTransactionIds)) {
            parsed = { ...parsed, processedAddonTransactionIds: [] };
          }
          // Yeni ay başladıysa kota sayacını sıfırla (bonusScans SIFIRLANMIYOR).
          if (parsed.currentPeriodStart !== startOfCurrentMonthISO()) {
            parsed = {
              ...parsed,
              scansUsedThisMonth: 0,
              currentPeriodStart: startOfCurrentMonthISO(),
            };
          }
          loaded = parsed;
        }
      } catch {
        // Bozuk/okunamaz kayıt — varsayılanla devam.
      }
      // NOT: loaded.isPremium/tierId burada ne olursa olsun, hemen aşağıda
      // RevenueCat'ten gelen gerçek değerle EZİLECEK — bu sadece local
      // alanların (kota/bonus) kaybolmaması için.
      setState(loaded);

      configurePurchases();
      const info = await getCustomerInfoSafe();
      const derived = info ? deriveTierFromCustomerInfo(info) : { isPremium: false as const, tierId: undefined };
      setState((prev) => ({ ...prev, isPremium: derived.isPremium, tierId: derived.tierId }));
      setLoading(false);

      unsubscribe = addCustomerInfoListener(applyCustomerInfo);
    })();
    return () => unsubscribe();
  }, [applyCustomerInfo]);

  const registerScan = useCallback(async () => {
    if (!state.isPremium) {
      if (state.scansUsedThisMonth < state.freeScansLimit) {
        await persist({ ...state, scansUsedThisMonth: state.scansUsedThisMonth + 1 });
      } else if (state.bonusScans > 0) {
        await persist({ ...state, bonusScans: state.bonusScans - 1 });
      } else {
        await persist({ ...state, scansUsedThisMonth: state.scansUsedThisMonth + 1 });
      }
      return;
    }
    const quota = getTier(state.tierId || DEFAULT_TIER_ID).scansPerMonth;
    if (state.scansUsedThisMonth < quota) {
      await persist({ ...state, scansUsedThisMonth: state.scansUsedThisMonth + 1 });
    } else if (state.bonusScans > 0) {
      await persist({ ...state, bonusScans: state.bonusScans - 1 });
    } else {
      await persist({ ...state, scansUsedThisMonth: state.scansUsedThisMonth + 1 });
    }
  }, [state, persist]);

  const activatePremium = useCallback(
    async (tierId: TierId) => {
      try {
        const info = await purchaseTierRC(tierId);
        applyCustomerInfo(info);
      } catch (err) {
        if (isUserCancelledError(err)) return;
        throw err;
      }
    },
    [applyCustomerInfo]
  );

  const cancelPremium = useCallback(async () => {
    const url = await getSubscriptionManagementUrl();
    await Linking.openURL(url);
  }, []);

  const purchaseAddon = useCallback(async () => {
    try {
      const { transactionId } = await purchaseAddonPack();
      setState((prev) => {
        if (transactionId && prev.processedAddonTransactionIds?.includes(transactionId)) {
          // Aynı satın alım (ör. bir geri yükleme çağrısında) zaten
          // işlenmiş — ikinci kez bonusScans eklemeyelim.
          return prev;
        }
        const next: SubscriptionState = {
          ...prev,
          bonusScans: prev.bonusScans + ADDON.extraScans,
          bonusScansTotal: prev.bonusScansTotal + ADDON.extraScans,
          processedAddonTransactionIds: transactionId
            ? [...(prev.processedAddonTransactionIds || []), transactionId].slice(-20)
            : prev.processedAddonTransactionIds,
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    } catch (err) {
      if (isUserCancelledError(err)) return;
      throw err;
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    const info = await restorePurchasesRC();
    applyCustomerInfo(info);
  }, [applyCustomerInfo]);

  const tierQuota = state.isPremium ? getTier(state.tierId || DEFAULT_TIER_ID).scansPerMonth : 0;
  const remainingFreeScans = Math.max(0, state.freeScansLimit - state.scansUsedThisMonth);
  const remainingTierScans = state.isPremium ? Math.max(0, tierQuota - state.scansUsedThisMonth) : 0;
  const tierQuotaExceeded = state.isPremium && state.scansUsedThisMonth >= tierQuota;
  const canScan = state.isPremium
    ? remainingTierScans > 0 || state.bonusScans > 0
    : remainingFreeScans > 0 || state.bonusScans > 0;
  const totalRemainingScans = (state.isPremium ? remainingTierScans : remainingFreeScans) + state.bonusScans;

  return (
    <SubscriptionContext.Provider
      value={{
        state,
        loading,
        canScan,
        remainingFreeScans,
        remainingTierScans,
        tierQuotaExceeded,
        totalRemainingScans,
        registerScan,
        activatePremium,
        cancelPremium,
        purchaseAddon,
        restorePurchases,
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
