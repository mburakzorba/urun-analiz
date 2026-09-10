// 9 Eylül eklemesi (kullanıcı isteği — "sorun bildir butonuna bassın yeter,
// butona bastığı anda bana direkt mail gelsin otomatik atsın"): bu dosya,
// Resend (https://resend.com) e-posta API'sini kullanarak GERÇEKTEN otomatik
// bir mail gönderiyor — kullanıcının kendi mail uygulamasını açıp "Gönder"e
// basmasına gerek yok.
//
// NEDEN RESEND? Ekstra bir npm paketi gerektirmiyor (düz fetch ile REST
// API'sini çağırıyoruz — Node 18+'ta fetch zaten global), ücretsiz planı
// var, ve doğrulanmamış bir alan adıyla (kendi alan adın olmadan) bile
// "onboarding@resend.dev" gönderen adresiyle hemen çalışıyor.
//
// KURULUM (kullanıcı için — NASIL_UYGULARIM.md'de de anlatılıyor):
// 1) resend.com'da ücretsiz bir hesap aç, bir API anahtarı üret.
// 2) Render > Environment'a şu 2 değişkeni ekle:
//    RESEND_API_KEY=<ürettiğin anahtar>
//    REPORT_EMAIL_TO=<bildirimlerin geleceği kendi e-posta adresin>
// 3) (Opsiyonel) REPORT_EMAIL_FROM ekleyebilirsin — kendi alan adını
//    resend.com'da doğrularsan (örn. "özünde <bildirim@ozunde.app>").
//    Doğrulamazsan varsayılan "onboarding@resend.dev" gönderen adresi
//    kullanılır — bu, Resend'in HERKESE açık, doğrulama gerektirmeyen test
//    göndereni; üretimde kendi alan adını doğrulaman önerilir ama zorunlu
//    değil, bildirim yine de ulaşır.
async function sendReportEmail({ subject, bodyLines, photoBuffer }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO;
  if (!apiKey || !to) {
    throw new Error(
      "RESEND_API_KEY veya REPORT_EMAIL_TO tanımlı değil — Render > Environment'a ekleyip yeniden deploy et."
    );
  }
  const from = process.env.REPORT_EMAIL_FROM || "özünde <onboarding@resend.dev>";

  const payload = {
    from,
    to: [to],
    subject,
    text: bodyLines.join("\n"),
  };
  if (photoBuffer) {
    payload.attachments = [
      {
        filename: "etiket-fotografi.jpg",
        content: photoBuffer.toString("base64"),
      },
    ];
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend API hatası ${res.status}: ${text || "(gövde boş)"}`);
  }
  return res.json();
}

module.exports = { sendReportEmail };
