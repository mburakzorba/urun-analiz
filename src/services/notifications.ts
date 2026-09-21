import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// 13 Eylül eklemesi: "kullanıcıyı ara sıra hatırlat" özelliği. NOT: bu
// bildirimler TAMAMEN CİHAZDA planlanıyor (Notifications.
// scheduleNotificationAsync) — uygulamanın hiç backend push altyapısı
// (device token toplama, Apple/Google push sunucularıyla entegrasyon) yok,
// ve bu basit/kişiye-özel-olmayan hatırlatmalar için buna hiç gerek de yok.
// Yerel bildirim, sunucu kurulmadan, internetsiz de çalışır, ve mağazalarda
// (App Store/Play Store) normal bir "local notification" olarak onaylanır.
// Gerçek, kişiye özel/sunucu tetikli push (örn. "birisi ürününü inceledi")
// istenirse o AYRI bir iş — device token + backend gönderim servisi gerekir.

// --- Bildirim tercihleri ---
// NotificationsScreen'deki 4 tercih (alerjen/formül/kampanya/hatırlatma) TEK
// bir AsyncStorage anahtarı altında tutuluyor. Anahtar/tip burada, merkezi
// olarak tanımlı — hem NotificationsScreen (kullanıcı anahtarı açıp/kapatır)
// hem de aşağıdaki refreshScheduledRemindersIfEnabled (uygulama her
// açıldığında, İZİN İSTEMEDEN, sessizce plana bakar) aynı yeri okuyor.
export const NOTIFICATION_PREFS_KEY = "urun-analiz:notificationPrefs";

export interface NotificationPrefs {
  allergenAlerts: boolean;
  formulaChanges: boolean;
  marketing: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  allergenAlerts: true,
  formulaChanges: true,
  marketing: false,
};

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    return raw ? { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) } : DEFAULT_NOTIFICATION_PREFS;
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}

// Uygulama arka plandayken/kapalıyken de bildirim gösterilsin, sesli ve
// bildirim merkezinde (liste) de görünsün — Android/iOS'un varsayılanı
// olmayan, YENİ shouldShowBanner/shouldShowList alanları expo-notifications
// SDK 57'de zorunlu (eski shouldShowAlert artık deprecated).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REMINDER_KIND = "scan-reminder";
const ANDROID_CHANNEL_ID = "hatirlatmalar";

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Hatırlatmalar",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Tarama hakkı olan (canScan=true) kullanıcılara: meraklandırıp taramaya
// çağıran, çeşitli metinler — her hatırlatmada AYNI cümle görünmesin diye
// bir HAVUZ halinde tutuluyor (bkz. aşağıdaki pickMessages).
const SCAN_NUDGE_MESSAGES: { title: string; body: string }[] = [
  { title: "Bugün ne kullandın?", body: "Elindeki bir ürünü 10 saniyede tara, içinde ne var öğren." },
  { title: "Merak ettiğin bir ürün mü var?", body: "Etiketini çek, cildine/saçına uygun mu hemen gör." },
  { title: "Dolabındakiler güvenli mi?", body: "Bir sonraki taramanı yapmaya ne dersin?" },
  { title: "Yeni bir şey mi aldın?", body: "Kullanmadan önce içeriğine göz at — tek taramayla öğren." },
  { title: "özünde seni bekliyor", body: "Son taramandan bir süre geçti, elindeki bir ürünü tara." },
  { title: "İçindekiler listesi şaşırtabilir", body: "Sık kullandığın bir ürünü hâlâ taramadıysan şimdi bak." },
  { title: "10 saniyelik merak", body: "Cildine uygun mu bilmediğin bir ürün var mı? Hemen öğren." },
  { title: "Taramadan kullanma, önce öğren", body: "Bugün taradığın bir ürün oldu mu?" },
];

// canScan=false olan ÜCRETSİZ kullanıcılara "hadi tara" demek YANILTICI
// olurdu (zaten tarayamıyor) — bunun yerine devam etmenin yolunu (ek paket/
// abonelik) hatırlatan, daha yumuşak bir havuz.
const LIMIT_REACHED_MESSAGES: { title: string; body: string }[] = [
  { title: "Taramaya devam etmek ister misin?", body: "Ücretsiz hakların bitti — ek tarama paketiyle hemen devam edebilirsin." },
  { title: "Merak ettiğin ürünler seni bekliyor", body: "Küçük bir ek paketle taramaya devam edebilirsin." },
  { title: "özünde'yi kullanmaya devam et", body: "Abone olmadan da ek tarama paketiyle taramaya dönebilirsin." },
  { title: "Bir sonraki taramana ne dersin?", body: "Sana uygun bir paket seçip hemen devam edebilirsin." },
];

// --- Ne sıklıkla gönderilsin? ---
// Haftada 2 kez (Salı akşamı + Cuma öğlen) varsayılan olarak seçildi — bunun
// "doğru" bir sayısı yok, bu bir tercih: günlük olsaydı, bir etiketi okuma
// gibi haftada birkaç kez yapılan bir eylem için çok sık olur, bildirimi/
// uygulamayı kapattırma riski yaratırdı; haftada 1 ise geri çağırma etkisi
// zayıf kalabilirdi. Bu iki değer (REMINDER_SLOTS) TEK yerden değiştirilir —
// gerçek kullanım verisine göre daha sonra kolayca ayarlanabilir.
// weekday: expo-notifications'ta 1=Pazar ... 7=Cumartesi.
const REMINDER_SLOTS: { weekday: number; hour: number; minute: number }[] = [
  { weekday: 3, hour: 19, minute: 0 }, // Salı 19:00
  { weekday: 6, hour: 11, minute: 30 }, // Cuma 11:30
];

// Kaç hafta ileriye planlansın — expo-notifications'ın "repeats" seçeneği
// her tetiklendiğinde AYNI içeriği tekrarlar; farklı mesajlar için burada
// N adet TEKİL ("date" tetikleyicili) bildirim planlanıyor, her biri kendi
// (gelecekteki) tarihiyle, farklı bir mesajla.
const WEEKS_AHEAD = 3;

function nextDateForSlot(slot: { weekday: number; hour: number; minute: number }, weeksOffset: number): Date {
  const now = new Date();
  const targetJsDay = slot.weekday - 1; // expo 1-7 (Paz..Cmt) -> JS Date 0-6
  const diff = (targetJsDay - now.getDay() + 7) % 7;
  const result = new Date(now);
  result.setDate(now.getDate() + diff + weeksOffset * 7);
  result.setHours(slot.hour, slot.minute, 0, 0);
  if (weeksOffset === 0 && result.getTime() <= now.getTime()) {
    result.setDate(result.getDate() + 7);
  }
  return result;
}

// Bir havuzdan, art arda aynı mesajı tekrarlamadan istenen sayıda mesaj
// seçer (havuz tükenince yeniden karılıp devam eder).
function pickMessages(pool: { title: string; body: string }[], count: number) {
  const out: { title: string; body: string }[] = [];
  let shuffled: { title: string; body: string }[] = [];
  while (out.length < count) {
    if (shuffled.length === 0) shuffled = [...pool].sort(() => Math.random() - 0.5);
    out.push(shuffled.shift()!);
  }
  return out;
}

export async function cancelAllReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === REMINDER_KIND)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

// Önündeki WEEKS_AHEAD hafta için hatırlatmaları yeniden planlar: mevcut
// (henüz tetiklenmemiş) hatırlatmaları önce iptal edip baştan kuruyor — bu
// sayede tarama hakkı durumu (canScan) değiştiğinde bir dahaki çağrıda
// doğru mesaj havuzuna geçilir.
export async function scheduleUpcomingReminders(canScan: boolean): Promise<void> {
  await ensureAndroidChannel();
  await cancelAllReminders();
  const pool = canScan ? SCAN_NUDGE_MESSAGES : LIMIT_REACHED_MESSAGES;
  const totalSlots = REMINDER_SLOTS.length * WEEKS_AHEAD;
  const messages = pickMessages(pool, totalSlots);
  let i = 0;
  for (let week = 0; week < WEEKS_AHEAD; week++) {
    for (const slot of REMINDER_SLOTS) {
      const date = nextDateForSlot(slot, week);
      const msg = messages[i++];
      await Notifications.scheduleNotificationAsync({
        content: { title: msg.title, body: msg.body, data: { kind: REMINDER_KIND } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
    }
  }
}

// Uygulama her açıldığında/ön plana geldiğinde (İZİN İSTEMEDEN!) çağrılır:
// kullanıcı hatırlatmayı açık bırakmışsa VE izin zaten verilmişse planı
// tazeler (ör. tarama hakkı durumu değiştiyse doğru mesaj havuzuna geçsin,
// ya da zaman geçtikçe 3 haftalık pencere ileri kaysın). İzin hiç
// verilmemişse burada ASLA sorulmaz — izin isteme SADECE
// NotificationsScreen'de, kullanıcı anahtarı kendi eliyle AÇTIĞINDA olur.
// 16 Eylül eklemesi: NotificationsScreen artık burada GERÇEKTEN planlanmış
// bir sonraki hatırlatmanın tarihini göstermek istiyor (eskiden orada sahte/
// "örnek" bir bildirim akışı vardı — kullanıcı haklı olarak bunun artık
// çalışan gerçek hatırlatma sistemiyle alakasız olduğunu belirtti). İzin
// yoksa null döner — ekran bu durumda "henüz planlanmadı" gösterir, uydurma
// bir tarih göstermez.
export async function getNextReminderDate(): Promise<Date | null> {
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return null;
    const dates = REMINDER_SLOTS.map((slot) => nextDateForSlot(slot, 0));
    dates.sort((a, b) => a.getTime() - b.getTime());
    return dates[0] ?? null;
  } catch {
    return null;
  }
}

// 18 Eylül değişikliği: kullanıcı geri bildirimi — "Hatırlatmalar" için ayrı
// bir anahtar/ekran adımı olmasın, kullanıcı zaten telefonun bildirim iznini
// açıp kapatabiliyor, bu YETERLİ bir "aç/kapa" kontrolü. Bu yüzden burada
// artık bir tercihe (eski reminderNudges alanı) bakmıyoruz — sadece izin
// durumuna bakıyoruz: izin hiç sorulmamışsa SESSİZCE (kullanıcıya bir
// açıklama ekranı göstermeden, doğrudan) OS'un kendi izin diyaloğunu
// tetikliyoruz; izin verilirse hatırlatmalar hemen planlanır. İzin zaten
// reddedilmişse (canAskAgain=false) burada tekrar sormuyoruz — OS zaten
// tekrar tekrar sormamıza izin vermez ve kullanıcıyı rahatsız eder.
export async function ensureRemindersScheduled(canScan: boolean): Promise<void> {
  try {
    await ensureAndroidChannel();
    let current = await Notifications.getPermissionsAsync();
    if (!current.granted && current.canAskAgain) {
      current = await Notifications.requestPermissionsAsync();
    }
    if (current.granted) {
      await scheduleUpcomingReminders(canScan);
    }
  } catch {
    // Sessizce geç — hatırlatma bildirimleri "olursa iyi olur" türünden,
    // uygulamanın asıl akışını (tarama/analiz) hiçbir şekilde bozmamalı.
  }
}
