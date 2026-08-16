import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProductAnalysis } from "../types";

const STORAGE_KEY = "urun-analiz:history";
const MAX_HISTORY = 50;

interface HistoryContextValue {
  history: ProductAnalysis[];
  loading: boolean;
  addAnalysis: (analysis: ProductAnalysis) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextValue | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ProductAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setHistory(JSON.parse(raw));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addAnalysis = useCallback(
    async (analysis: ProductAnalysis) => {
      const next = [analysis, ...history].slice(0, MAX_HISTORY);
      setHistory(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [history]
  );

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <HistoryContext.Provider value={{ history, loading, addAnalysis, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory, HistoryProvider içinde kullanılmalı");
  return ctx;
}
