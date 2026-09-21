import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { supabase, isSupabaseConfigured } from "../services/supabase";

// 16 Eylül eklemesi: gerçek hesap sistemi. Kimlik doğrulamanın kendisi
// (kayıt/giriş/Google/oturum) Supabase Auth'ta yaşıyor (bkz.
// services/supabase.ts'in başındaki uzun not) — bu context SADECE o
// SDK'nın etrafına, uygulamanın geri kalanının rahat kullanacağı ince bir
// katman koyuyor (SubscriptionContext/HistoryContext ile aynı desen).
//
// ÖNEMLİ — bu hesap sistemi bilinçli olarak KİMLİK içindir, VERİ SENKRONU
// için değil: hesabına giriş yapman abonelik/geçmiş/profil verini şu an
// cihazlar arası TAŞIMIYOR (bunlar hâlâ sadece bu cihazda, AsyncStorage'da).
// Bu ayrı, daha büyük bir iş (bkz. teslimat notlarındaki "sıradaki adım").

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const APP_SECRET = process.env.EXPO_PUBLIC_APP_SECRET;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

// Supabase'in İngilizce hata mesajlarını, kullanıcıya gösterilecek anlaşılır
// Türkçe metinlere çeviriyoruz — ham "Invalid login credentials" gibi
// mesajları ekrana basmak yerine.
function mapAuthErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-posta veya şifre hatalı.";
  if (m.includes("user already registered") || m.includes("already registered")) return "Bu e-posta ile zaten bir hesap var.";
  if (m.includes("email not confirmed")) return "E-postanı henüz onaylamamışsın — gelen kutunu kontrol et.";
  if (m.includes("password") && m.includes("at least")) return "Şifre en az 6 karakter olmalı.";
  if (m.includes("rate limit")) return "Çok fazla deneme yapıldı, birazdan tekrar dene.";
  if (m.includes("network")) return "İnternet bağlantısı yok gibi görünüyor.";
  return message;
}

interface AuthResult {
  error?: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  // .env doldurulmadıysa (Supabase henüz kurulmadıysa) true — ekranlar
  // bunu görüp "hesap sistemi henüz kurulmadı" diye net bir uyarı gösterir,
  // sessizce takılıp kalmak yerine.
  isConfigured: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult & { needsEmailConfirmation?: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  // Hesabı KALICI olarak siler (bkz. server/src/index.js > /account/delete).
  // Cihazdaki abonelik/geçmiş/profil verisine DOKUNMAZ — onlar için Ayarlar >
  // "Verilerimi sil" ayrı bir işlem (bkz. SettingsScreen.tsx).
  deleteAccount: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const googleConfigured = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // GoogleSignin.configure() bir kez, ilk kullanılmadan önce çağrılmalı.
  // GOOGLE_WEB_CLIENT_ID tanımlı değilse (henüz Google Cloud Console kurulumu
  // yapılmadıysa) hiç çağırmıyoruz — signInWithGoogle o durumda anlaşılır bir
  // hata döner (aşağıda), uygulamanın geri kalanı normal çalışmaya devam eder.
  function ensureGoogleConfigured() {
    if (googleConfigured.current || !GOOGLE_WEB_CLIENT_ID) return;
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    googleConfigured.current = true;
  }

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) return { error: mapAuthErrorMessage(error.message) };
    // Supabase projesinde "e-posta onayı" açıksa, kayıt sonrası oturum
    // (data.session) hemen gelmez — kullanıcı önce e-postasını onaylamalı.
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: mapAuthErrorMessage(error.message) };
    return {};
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      return { error: "Google ile giriş henüz kurulmadı (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID eksik)." };
    }
    try {
      ensureGoogleConfigured();
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      if (result.type === "cancelled") return {};
      const idToken = result.data.idToken;
      if (!idToken) return { error: "Google'dan kimlik bilgisi alınamadı." };
      const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
      if (error) return { error: mapAuthErrorMessage(error.message) };
      return {};
    } catch (err) {
      if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) return {};
      console.warn("[AuthContext] Google ile giriş başarısız:", err);
      return { error: "Google ile giriş başarısız oldu. Tekrar dener misin?" };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (await GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
    } catch {
      // Google ile hiç giriş yapılmamışsa/kurulmamışsa sessizce geç.
    }
    await supabase.auth.signOut();
  }, []);

  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
    if (!session) return { error: "Giriş yapılmamış." };
    if (!API_URL) return { error: "Sunucu adresi tanımlı değil (EXPO_PUBLIC_API_URL)." };
    try {
      const res = await fetch(`${API_URL}/account/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          ...(APP_SECRET ? { "x-app-secret": APP_SECRET } : {}),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body?.error || "Hesap silinemedi, tekrar dener misin?" };
      }
      await signOut();
      return {};
    } catch (err) {
      console.warn("[AuthContext] Hesap silme isteği başarısız:", err);
      return { error: "Sunucuya ulaşılamadı." };
    }
  }, [session, signOut]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isConfigured: isSupabaseConfigured,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return ctx;
}
