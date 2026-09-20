const { createClient } = require("@supabase/supabase-js");

// 16 Eylül eklemesi: hesap silme SADECE burada, backend'de, "service role"
// anahtarıyla yapılabilir. Bu anahtar Supabase projesindeki TÜM kullanıcı
// verisine tam erişim verir (Row Level Security'yi bile atlar) — bu yüzden
// ASLA client uygulamasına (EXPO_PUBLIC_... değişkenlerine) KONULMAZ, sadece
// burada, sunucu tarafı bir ortam değişkeni (SUPABASE_SERVICE_ROLE_KEY)
// olarak durur. Client (uygulama) tarafında bunun yerine "anon" anahtar
// kullanılıyor (bkz. src/services/supabase.ts) — o, Supabase'in kendi
// güvenlik kurallarına (Row Level Security) tabidir ve hesap silmeye
// yetmez.
let cachedClient = null;

function getSupabaseAdmin() {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  cachedClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}

module.exports = { getSupabaseAdmin };
