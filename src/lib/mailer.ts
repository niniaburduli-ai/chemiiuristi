import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { dbConnect } from "@/lib/db";
import { EmailLog, computeExpireAt, type EmailType } from "@/lib/models/EmailLog";
import { SITE_URL } from "@/lib/seo";

const LOGO_URL = `${SITE_URL}/logo-themis.png`;

/** Brand shell (navy header + gold logo, cream card body) wrapped around each email's own content. `accentColor` is the thin status bar under the header — green for success, red for failure, amber for reminders, gold as the default. */
function emailShell(bodyHtml: string, accentColor = "#E6A817"): string {
  return `
  <div style="margin:0;padding:24px;background:#FAF8F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#10182B">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#FFF7E6;border-radius:16px;border:1px solid #E8D9AE;overflow:hidden">
      <tr><td style="background:#0B1220;padding:20px 32px;text-align:center">
        <img src="${LOGO_URL}" alt="Chemiiuristi" width="32" height="32" style="display:inline-block;vertical-align:middle">
        <span style="display:inline-block;vertical-align:middle;margin-left:10px;color:#FFFFFF;font-size:16px;font-weight:700;letter-spacing:.02em">ჩემი იურისტი</span>
      </td></tr>
      <tr><td style="height:4px;background:${accentColor}"></td></tr>
      <tr><td style="padding:32px">${bodyHtml}</td></tr>
    </table>
  </div>`;
}

/**
 * Gmail SMTP transport, created once and reused across hot reloads (same
 * singleton trick as the Mongoose connection in lib/db.ts).
 */
declare global {
  var mailerTransport: Transporter | undefined;
}

function getTransport(): Transporter {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error("SMTP_USER / SMTP_PASS are not set");
  }

  if (global.mailerTransport) return global.mailerTransport;

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  global.mailerTransport = transport;
  return transport;
}

export function fromAddress(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "";
}

/** Records a sent (or failed) email so admins can review/purge correspondence later. */
async function logEmail(
  type: EmailType,
  to: string,
  subject: string,
  status: "sent" | "failed",
  error?: unknown
): Promise<void> {
  try {
    await dbConnect();
    await EmailLog.create({
      to,
      subject,
      type,
      status,
      error: error instanceof Error ? error.message : error ? String(error) : undefined,
      expireAt: computeExpireAt(type),
    });
  } catch {
    // Logging is best-effort — never let it mask the original send result.
  }
}

/** Bilingual (Georgian-first) password-reset email with the magic link. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const transport = getTransport();

  const subject = "პაროლის აღდგენა · Reset your password";

  const text = [
    "პაროლის აღდგენა",
    "მიიღეთ ეს წერილი, რადგან მოითხოვეთ პაროლის აღდგენა.",
    "გადადით ბმულზე ახალი პაროლის დასაყენებლად (ბმული მოქმედებს 1 საათი):",
    resetUrl,
    "",
    "თუ ეს თქვენ არ მოგითხოვიათ, უბრალოდ უგულებელყავით ეს წერილი.",
    "",
    "—",
    "",
    "Reset your password",
    "You received this email because a password reset was requested.",
    "Open the link below to set a new password (valid for 1 hour):",
    resetUrl,
    "",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n");

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700">პაროლის აღდგენა</h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#5E6674">
      მიიღეთ ეს წერილი, რადგან მოითხოვეთ პაროლის აღდგენა. დააჭირეთ ღილაკს ახალი პაროლის დასაყენებლად. ბმული მოქმედებს <strong>1 საათი</strong>.
    </p>
    <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#E6A817;color:#0B1220;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700">
      ახალი პაროლის დაყენება
    </a>
    <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8A8370">
      თუ ღილაკი არ მუშაობს, დააკოპირეთ ეს ბმული ბრაუზერში:<br>
      <a href="${resetUrl}" style="color:#0B1220;word-break:break-all">${resetUrl}</a>
    </p>
    <hr style="border:none;border-top:1px solid #E8D9AE;margin:24px 0">
    <p style="margin:0;font-size:12px;line-height:1.6;color:#8A8370">
      თუ ეს თქვენ არ მოგითხოვიათ, უგულებელყავით ეს წერილი.<br>
      <em>If you didn't request a password reset, you can safely ignore this email.</em>
    </p>
  `);

  try {
    await transport.sendMail({ from: fromAddress(), to, subject, text, html });
  } catch (err) {
    await logEmail("password-reset", to, subject, "failed", err);
    throw err;
  }
  await logEmail("password-reset", to, subject, "sent");
}

/** Bilingual (Georgian-first) welcome email sent right after account creation. */
export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const transport = getTransport();

  const subject = "კეთილი იყოს თქვენი მობრძანება · Welcome to Chemiiuristi";

  const text = [
    `გამარჯობა, ${name}!`,
    "მადლობთ, რომ დარეგისტრირდით „ჩემი იურისტი“-ზე.",
    "შეგიძლიათ დაუყოვნებლივ დაუსვათ კითხვა AI იურისტს, დააგენერიროთ დოკუმენტის შაბლონი ან შეამოწმოთ არსებული დოკუმენტი.",
    "",
    "—",
    "",
    `Hi, ${name}!`,
    "Thanks for registering with Chemiiuristi.",
    "You can start asking the AI lawyer questions, generate a document template, or review an existing document right away.",
  ].join("\n");

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700">კეთილი იყოს თქვენი მობრძანება, ${name}!</h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#5E6674">
      მადლობთ, რომ დარეგისტრირდით „ჩემი იურისტი“-ზე. შეგიძლიათ დაუყოვნებლივ დაუსვათ კითხვა AI იურისტს, დააგენერიროთ დოკუმენტის შაბლონი ან შეამოწმოთ არსებული დოკუმენტი.
    </p>
    <hr style="border:none;border-top:1px solid #E8D9AE;margin:24px 0">
    <p style="margin:0;font-size:12px;line-height:1.6;color:#8A8370">
      Welcome, ${name}!<br>
      Thanks for registering with Chemiiuristi. You can start asking the AI lawyer questions, generate a document template, or review an existing document right away.
    </p>
  `);

  try {
    await transport.sendMail({ from: fromAddress(), to, subject, text, html });
  } catch (err) {
    await logEmail("welcome", to, subject, "failed", err);
    throw err;
  }
  await logEmail("welcome", to, subject, "sent");
}

/** Bilingual quota line, e.g. "5 კონსულტაცია · 5 consultations" — omitted entirely when 0. */
function quotaLines(quotas: { labelKa: string; labelEn: string; amount: number }[]): string {
  return quotas
    .filter((q) => q.amount > 0)
    .map((q) => `${q.amount} ${q.labelKa} · ${q.amount} ${q.labelEn}`)
    .join("\n");
}

/** Bilingual payment-confirmation email for both subscription activations and custom-package purchases. */
export async function sendPaymentConfirmationEmail(
  to: string,
  opts: {
    name: string;
    planNameKa: string;
    planNameEn: string;
    amount: number; // minor units (tetri)
    currency: string;
    consultations: number;
    docGeneration: number;
    docReview: number;
    docTemplates: number;
  }
): Promise<void> {
  const transport = getTransport();

  const majorAmount = (opts.amount / 100).toFixed(2);
  const subject = "გადახდა დადასტურებულია · Payment confirmed";

  const quotas = quotaLines([
    { labelKa: "კონსულტაცია", labelEn: "consultations", amount: opts.consultations },
    { labelKa: "დოკუმენტის გენერირება", labelEn: "document generations", amount: opts.docGeneration },
    { labelKa: "დოკუმენტის შემოწმება", labelEn: "document reviews", amount: opts.docReview },
    { labelKa: "შაბლონი", labelEn: "templates", amount: opts.docTemplates },
  ]);

  const text = [
    `გამარჯობა, ${opts.name}!`,
    `თქვენი გადახდა (${majorAmount} ${opts.currency}) წარმატებით დადასტურდა — ${opts.planNameKa}.`,
    quotas ? "დაემატა:" : "",
    quotas,
    "",
    "—",
    "",
    `Hi, ${opts.name}!`,
    `Your payment (${majorAmount} ${opts.currency}) was confirmed — ${opts.planNameEn}.`,
    quotas ? "Added:" : "",
    quotas,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700">გადახდა დადასტურებულია</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#5E6674">
      თქვენი გადახდა <strong>${majorAmount} ${opts.currency}</strong> წარმატებით დადასტურდა — ${opts.planNameKa}.
    </p>
    ${quotas ? `<pre style="margin:0 0 20px;font:inherit;white-space:pre-wrap;font-size:13px;color:#10182B">${quotas}</pre>` : ""}
    <hr style="border:none;border-top:1px solid #E8D9AE;margin:24px 0">
    <p style="margin:0;font-size:12px;line-height:1.6;color:#8A8370">
      Your payment (${majorAmount} ${opts.currency}) was confirmed — ${opts.planNameEn}.
    </p>
  `, "#16a34a");

  try {
    await transport.sendMail({ from: fromAddress(), to, subject, text, html });
  } catch (err) {
    await logEmail("payment-confirmation", to, subject, "failed", err);
    throw err;
  }
  await logEmail("payment-confirmation", to, subject, "sent");
}

const DECLINE_REASON_KA: Record<string, string> = {
  declined: "თანხის ჩამოჭრა ვერ მოხერხდა",
  expired: "ბარათის ვადა ამოიწურა",
  reversed: "გადახდა გაუქმდა",
};
const DECLINE_REASON_EN: Record<string, string> = {
  declined: "the charge could not be completed",
  expired: "your card has expired",
  reversed: "the payment was reversed",
};

/** Bilingual real-time notice sent when a Flitt subscription charge is declined/expired/reversed. */
export async function sendPaymentFailedEmail(
  to: string,
  opts: { name: string; reason: string }
): Promise<void> {
  const transport = getTransport();

  const reasonKa = DECLINE_REASON_KA[opts.reason] ?? "გადახდა ვერ დადასტურდა";
  const reasonEn = DECLINE_REASON_EN[opts.reason] ?? "the payment could not be confirmed";
  const subject = "გადახდა ვერ შესრულდა · Payment failed";

  const text = [
    `გამარჯობა, ${opts.name}!`,
    `თქვენი გამოწერის განახლება ვერ მოხერხდა: ${reasonKa}. თქვენი გეგმა დაბრუნდა უფასო პაკეტზე.`,
    "გთხოვთ, განაახლოთ გადახდის მეთოდი ბილინგის გვერდზე, რომ განაგრძოთ სრული წვდომა.",
    "",
    "—",
    "",
    `Hi, ${opts.name}!`,
    `Your subscription renewal failed: ${reasonEn}. Your plan has been reverted to the free tier.`,
    "Please update your payment method on the billing page to restore full access.",
  ].join("\n");

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700">გადახდა ვერ შესრულდა</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#5E6674">
      თქვენი გამოწერის განახლება ვერ მოხერხდა: <strong>${reasonKa}</strong>. თქვენი გეგმა დაბრუნდა უფასო პაკეტზე. გთხოვთ, განაახლოთ გადახდის მეთოდი ბილინგის გვერდზე.
    </p>
    <hr style="border:none;border-top:1px solid #E8D9AE;margin:24px 0">
    <p style="margin:0;font-size:12px;line-height:1.6;color:#8A8370">
      Your subscription renewal failed: ${reasonEn}. Your plan has been reverted to the free tier. Please update your payment method on the billing page.
    </p>
  `, "#dc2626");

  try {
    await transport.sendMail({ from: fromAddress(), to, subject, text, html });
  } catch (err) {
    await logEmail("payment-failed", to, subject, "failed", err);
    throw err;
  }
  await logEmail("payment-failed", to, subject, "sent");
}

/** Bilingual "renews tomorrow" reminder — sent by the reminders cron ~24h before resetAt. */
export async function sendRenewalReminderEmail(
  to: string,
  opts: { name: string; planNameKa: string; planNameEn: string; amount: number; currency: string }
): Promise<void> {
  const transport = getTransport();

  const majorAmount = (opts.amount / 100).toFixed(2);
  const subject = "გადახდა ხვალ განხორციელდება · Payment due tomorrow";

  const text = [
    `გამარჯობა, ${opts.name}!`,
    `შეგახსენებთ, რომ ხვალ განახლდება თქვენი გამოწერა (${opts.planNameKa}) და ჩამოგეჭრებათ ${majorAmount} ${opts.currency}.`,
    "",
    "—",
    "",
    `Hi, ${opts.name}!`,
    `Just a heads-up: your ${opts.planNameEn} subscription renews tomorrow and ${majorAmount} ${opts.currency} will be charged.`,
  ].join("\n");

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700">გადახდა ხვალ განხორციელდება</h1>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#5E6674">
      შეგახსენებთ, რომ ხვალ განახლდება თქვენი გამოწერა (<strong>${opts.planNameKa}</strong>) და ჩამოგეჭრებათ <strong>${majorAmount} ${opts.currency}</strong>.
    </p>
    <hr style="border:none;border-top:1px solid #E8D9AE;margin:24px 0">
    <p style="margin:0;font-size:12px;line-height:1.6;color:#8A8370">
      Just a heads-up: your ${opts.planNameEn} subscription renews tomorrow and ${majorAmount} ${opts.currency} will be charged.
    </p>
  `, "#d97706");

  try {
    await transport.sendMail({ from: fromAddress(), to, subject, text, html });
  } catch (err) {
    await logEmail("payment-reminder", to, subject, "failed", err);
    throw err;
  }
  await logEmail("payment-reminder", to, subject, "sent");
}

/** Bilingual next-day nudge — sent by the reminders cron ~24h after a decline, to retry payment. */
export async function sendPaymentRetryReminderEmail(to: string, name: string): Promise<void> {
  const transport = getTransport();

  const subject = "გადახდა ჯერ არ შესრულებულა · Payment still pending";

  const text = [
    `გამარჯობა, ${name}!`,
    "თანხის უკმარისობის გამო თქვენი გადახდა ვერ შესრულდა და გეგმა დაბრუნდა უფასო პაკეტზე.",
    "გთხოვთ, განაახლოთ გადახდის მეთოდი ბილინგის გვერდზე, რომ განაგრძოთ სრული წვდომა.",
    "",
    "—",
    "",
    `Hi, ${name}!`,
    "Your payment couldn't go through due to insufficient funds, and your plan reverted to the free tier.",
    "Please update your payment method on the billing page to restore full access.",
  ].join("\n");

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700">გადახდა ჯერ არ შესრულებულა</h1>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#5E6674">
      თანხის უკმარისობის გამო თქვენი გადახდა ვერ შესრულდა და გეგმა დაბრუნდა უფასო პაკეტზე. გთხოვთ, განაახლოთ გადახდის მეთოდი ბილინგის გვერდზე.
    </p>
    <hr style="border:none;border-top:1px solid #E8D9AE;margin:24px 0">
    <p style="margin:0;font-size:12px;line-height:1.6;color:#8A8370">
      Your payment couldn't go through due to insufficient funds, and your plan reverted to the free tier. Please update your payment method on the billing page.
    </p>
  `, "#d97706");

  try {
    await transport.sendMail({ from: fromAddress(), to, subject, text, html });
  } catch (err) {
    await logEmail("payment-reminder", to, subject, "failed", err);
    throw err;
  }
  await logEmail("payment-reminder", to, subject, "sent");
}

/** Notifies the configured contact address when a visitor submits site feedback. */
export async function sendFeedbackEmail(
  to: string,
  feedback: { rating?: number; message: string }
): Promise<void> {
  const transport = getTransport();

  const stars = feedback.rating != null ? "★".repeat(feedback.rating) + "☆".repeat(5 - feedback.rating) : null;
  const subject = stars
    ? `ახალი უკუკავშირი · New feedback (${feedback.rating}/5)`
    : "ახალი უკუკავშირი · New feedback";
  const escapedMessage = feedback.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const text = [
    "ახალი უკუკავშირი საიტიდან",
    stars ? `შეფასება: ${stars} (${feedback.rating}/5)` : "შეფასების გარეშე",
    "",
    feedback.message,
  ].join("\n");

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700">ახალი უკუკავშირი</h1>
    ${stars ? `<p style="margin:0 0 16px;font-size:20px;letter-spacing:2px;color:#E6A817">${stars}</p>` : ""}
    <p style="margin:0;font-size:14px;line-height:1.6;color:#10182B;white-space:pre-wrap">${escapedMessage}</p>
  `);

  try {
    await transport.sendMail({ from: fromAddress(), to, subject, text, html });
  } catch (err) {
    await logEmail("feedback", to, subject, "failed", err);
    throw err;
  }
  await logEmail("feedback", to, subject, "sent");
}
