import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// 16 Eylül eklemesi: gerçek hesap sistemi (e-posta/şifre + Google ile giriş).
// NOT: bu, kendi backend'imizde (server/) DEĞİL, Supabase'in barındırdığı
// hazır bir "Auth" servisinde çalışıyor — kullanıcı tablosu, şifre hash'leme,
// oturum (JWT) üretimi, Google OAuth doğrulaması hepsi Supabase tarafında.
// Kendi backend'imiz (server/src/index.js) buna SADECE TEK bir yerde
// dokunuyor: hesap SİLME işleminde (bkz. server/src/index.js > /account/delete)
// — çünkü bir hesabı gerçekten silmek "service role" denen gizli bir anahtar
// gerektiriyor ve o anahtar KESİNLİKLE uygulamanın içine (client'a) konulamaz,
// sadece sunucuda durabilir.
//
// Neden Supabase (kendi sunucumuzda auth yazmak yerine)? Çünkü e-posta/şifre
// + Google girişini SIFIRDAN doğru/güvenli yazmak (şifre hash'leme, JWT
// imzalama/yenileme, şifre sıfırlama e-postası, Google token doğrulama)
// başlı başına büyük ve güvenlik açısından hataya çok açık bir iş — Supabase
// bunu ücretsiz planda hazır, test edilmiş şekilde sunuyor.
//
// KURULUM GEREKİYOR (bkz. NASIL_UYGULARIM.md): supabase.com'da ücretsiz bir
// proje aç, Project URL + anon public key'i al, .env dosyasına
// EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY olarak yapıştır.
// "anon key" GİZLİ değildir — uygulamanın içine gömülmesi (public olması)
// normaldir, Supabase'in güvenlik kuralları (RLS) buna göre tasarlanmıştır.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// .env doldurulmadan da uygulamanın GERİ KALANI (tarama, abonelik vb.)
// çalışmaya devam etsin diye burada hemen çökmüyoruz — sadece hesap
// ekranlarına girildiğinde (bkz. AuthContext) anlaşılır bir uyarı gösteriyoruz.
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY tanımlı değil — hesap (giriş/üye ol) ekranları çalışmayacak. bkz. .env.example."
  );
}

export const supabase = createClient(SUPABASE_URL || "https://placeholder.supabase.co", SUPABASE_ANON_KEY || "placeholder", {
  auth: {
    // Oturumu (giriş yapılmış kullanıcıyı) cihazda AsyncStorage'da tutar —
    // uygulama kapanıp açılınca kullanıcı tekrar giriş yapmak zorunda kalmaz.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // React Native'de tarayıcı URL'i yok — Supabase'in web'e özel
    // "session URL'den oku" davranışını kapatıyoruz.
    detectSessionInUrl: false,
  },
});
