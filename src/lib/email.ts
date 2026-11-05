import "server-only";

const FROM = process.env.EMAIL_FROM ?? "JonWin Clean <onboarding@resend.dev>";

/** Sends an email through Resend. Without RESEND_API_KEY (local development) it prints to the console. */
export async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[email to ${to}] ${subject}\n${text}\n`);
    return;
  }
  const { Resend } = await import("resend");
  const { error } = await new Resend(key).emails.send({ from: FROM, to, subject, text });
  if (error) console.error("Email failed", error.name);
}
