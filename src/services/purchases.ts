// RevenueCat entegrasyonu — GERÇEK satın alma altyapısı.
//
// 21 Eylül eklemesi: Uygulamanın tüm RevenueCat (react-native-purchases)
// çağrıları TEK YERDEN buradan geçer. SubscriptionContext ve ekranlar
// (PaymentScreen, SubscriptionScreen) RevenueCat'i ASLA doğrudan çağırmaz —
// hepsi bu modülün fonksiyonlarını kullanır. Böylece "hangi ürün kimliği
// hangi pakete karşılık geliyor", "hata nasıl gösterilir" gibi mantık tek
// yerde kalır.
//
// Play Console taraf yapısı (bkz. utils/plans.ts):
//  - TEK bir abonelik ürünü ("ozunde_premium"), 4 farklı temel plan
//    (base plan) ile: baslangic-aylik / pro-aylik / premium-aylik /
//    elite-aylik. RevenueCat/Play Billing bunları
//    "ozunde_premium:baslangic-aylik" gibi TEK bir productId ile görür.
//  - TEK bir tek-seferlik (tüketilebilir) ürün: "ek_5_tarama".
//  - RevenueCat panelinde bu 4 abonelik ürününün HER BİRİNE aynı "premium"
//    yetkisi (entitlement) bağlanmalı — hangi paketin aktif olduğunu, o
//    yetkiyi veren ürünün kimliğinden (productIdentifier) plans.ts >
//    getTierByProductId ile geri buluyoruz. Ek tarama paketi bir
//    entitlement'a bağlı DEĞİL (abonelik değil) — ayrıca ele alınıyor
//    (bkz. purchaseAddonPack).
//
// NOT (bilinçli kapsam sınırı): Bu entegrasyon şimdilik SADECE Android/Play
// Store için (uygulamanın Play Store lansmanı bu yüzden yapılıyor). RevenueCat
// SDK'sı iOS App Store API anahtarıyla da yapılandırılabilir ama o, ayrı bir
// iş turu (bkz. teslimat notları).
//
// NOT (hesap sistemiyle ilişkisi): AuthContext.tsx'in başındaki notta
// açıkça belirtildiği gibi, hesaba giriş yapmak şu an abonelik/geçmiş
// verisini cihazlar arası TAŞIMIYOR — bu bilinçli bir tasarım. Aynı tutarlı
// davranışı korumak için RevenueCat de burada Supabase kullanıcı kimliğine
// BAĞLANMIYOR; SDK kendi anonim (cihaza özel) kimliğini kullanıyor. Yani bir
// kullanıcı hesabını başka bir cihazda açarsa aboneliğini o cihazda görmez —
// bu, hesap sisteminin zaten var olan sınırıyla aynı, yeni bir kısıtlama
// değil. İleride hesap ⇄ abonelik senkronu istenirse, burada
// Purchases.logIn(supabaseUserId) eklemek yeterli olur.
import { Platform } from "react-native";
import Purchases, { CustomerInfo, PurchasesStoreProduct } from "react-native-purchases";
import { TierId, TIERS, ADDON, getTierByProductId } from "../utils/plans";

// RevenueCat panelinde: Project Settings > API Keys > "özünde (Play Store)"
// uygulamasının PUBLIC (app-specific) anahtarı. Bu bir "gizli" anahtar
// DEĞİLDİR — App Store/Google Play API anahtarları gibi, client koduna
// gömülmesi normaldir ve beklenir (RevenueCat'in kendi dokümantasyonu da
// bunu söylüyor). .env dosyana şunu ekle:
//   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_XXXXXXXXXXXXXXXXXXXXXXXXXXX
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

// Tüm abonelik paketlerinin RevenueCat panelinde bağlı olduğu ortak yetki
// (entitlement) kimliği — panelde AYNEN bu isimle oluşturulmalı: "premium".
export const ENTITLEMENT_ID = "premium";

let configured = false;
let configureAttempted = false;

// Uygulama açılışında (App.tsx / SubscriptionContext ilk mount) bir kez
// çağrılır. Anahtar eksikse veya platform Android değilse sessizce hiçbir
// şey yapmaz — satın alma fonksiyonları bu durumda anlaşılır bir hata fırlatır
// (aşağıda), uygulamanın geri kalanı (tarama, geçmiş vb.) normal çalışır.
export function configurePurchases() {
  if (configureAttempted) return;
  configureAttempted = true;
  if (Platform.OS !== "android") {
    // Şimdilik sadece Android/Play Store akışı bağlandı (bkz. üstteki not).
    return;
  }
  if (!REVENUECAT_ANDROID_API_KEY) {
    console.warn(
      "[purchases] EXPO_PUBLIC_REVENUECAT_ANDROID_KEY tanımlı değil — gerçek satın alma çalışmayacak."
    );
    return;
  }
  Purchases.configure({ apiKey: REVENUECAT_ANDROID_API_KEY });
  if (__DEV__) {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG).catch(() => {});
  }
  configured = true;
}

export function isPurchasesConfigured(): boolean {
  return configured;
}

// customerInfo -> { isPremium, tierId } türetimi. RevenueCat burada "tek
// doğru kaynak" (source of truth) — hangi paketin aktif olduğunu local'de
// HİÇ saklamıyoruz, her zaman buradan okuyoruz (bkz. SubscriptionContext).
export function deriveTierFromCustomerInfo(info: CustomerInfo): { isPremium: boolean; tierId?: TierId } {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) return { isPremium: false };
  const tier = getTierByProductId(entitlement.productIdentifier);
  return { isPremium: true, tierId: tier?.id };
}

export async function getCustomerInfoSafe(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (err) {
    console.warn("[purchases] getCustomerInfo başarısız:", err);
    return null;
  }
}

// SubscriptionContext bunu mount'ta bir kez çağırır, dönen "unsubscribe"
// fonksiyonunu unmount'ta çalıştırır. Listener, satın alma/yenileme/iptal/
// geri yükleme gibi her değişiklikte tetiklenir — uygulama içi state'i
// RevenueCat ile senkron tutmanın ana yolu budur.
export function addCustomerInfoListener(cb: (info: CustomerInfo) => void): () => void {
  if (!configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(cb);
  return () => Purchases.removeCustomerInfoUpdateListener(cb);
}

function assertConfigured() {
  if (!configured) {
    throw new Error(
      "Satın alma altyapısı henüz hazır değil (RevenueCat yapılandırılmadı). Lütfen daha sonra tekrar dene."
    );
  }
}

async function fetchStoreProduct(productId: string): Promise<PurchasesStoreProduct> {
  const { products } = await Purchases.getProducts([productId]);
  const product = products[0];
  if (!product) {
    throw new Error(
      `"${productId}" ürünü Google Play'de bulunamadı. Bu ürün Play Console'da henüz oluşturulmamış/yayınlanmamış olabilir.`
    );
  }
  return product;
}

// Kullanıcı iptal ederse (satın alma sheet'ini kapatırsa) RevenueCat bunu
// hata olarak fırlatır — bu, gerçek bir hata değil, kasıtlı bir vazgeçme.
// Çağıran taraf (SubscriptionContext) bunu ayırt edip sessizce geçebilsin
// diye dışa açıyoruz.
export function isUserCancelledError(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { userCancelled?: boolean }).userCancelled === true;
}

// Bir pakete (TierId) abone olma akışını başlatır — Google Play'in kendi
// satın alma ekranını açar. Sonuç: güncel CustomerInfo (başarılıysa artık
// "premium" yetkisi aktif olmalı — deriveTierFromCustomerInfo ile kontrol
// edilebilir, ama listener zaten context'i otomatik güncelleyecek).
export async function purchaseTier(tierId: TierId): Promise<CustomerInfo> {
  assertConfigured();
  const tier = TIERS.find((t) => t.id === tierId);
  if (!tier) throw new Error(`Tanımsız paket: ${tierId}`);
  const product = await fetchStoreProduct(tier.productId);
  const { customerInfo } = await Purchases.purchaseStoreProduct(product);
  return customerInfo;
}

// Tek seferlik ek tarama paketi satın alımı. transactionId, aynı satın
// alımın iki kez sayılıp bonusScans'e iki kez eklenmemesi için
// SubscriptionContext tarafında kullanılıyor (bkz. orada processedAddon...).
export async function purchaseAddonPack(): Promise<{ customerInfo: CustomerInfo; transactionId: string | null }> {
  assertConfigured();
  const product = await fetchStoreProduct(ADDON.productId);
  const { customerInfo, transaction } = await Purchases.purchaseStoreProduct(product);
  return { customerInfo, transactionId: transaction?.transactionIdentifier ?? null };
}

// "Aboneliğimi iptal et" — Google Play Billing'de abonelik iptali UYGULAMA
// İÇİNDEN YAPILAMAZ (RevenueCat SDK'sı da dahil, hiçbir SDK bunu yapamaz);
// kullanıcı Google Play'in kendi abonelik yönetimi sayfasına yönlendirilir.
// customerInfo.managementURL varsa (genelde vardır, doğrudan bu aboneliğe
// gider) onu, yoksa Play Store'un genel abonelikler sayfasını döner.
export async function getSubscriptionManagementUrl(): Promise<string> {
  const info = await getCustomerInfoSafe();
  return info?.managementURL || "https://play.google.com/store/account/subscriptions";
}

export async function restorePurchases(): Promise<CustomerInfo> {
  assertConfigured();
  return Purchases.restorePurchases();
}
