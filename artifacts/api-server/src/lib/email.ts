import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_DOMAIN = process.env.RESEND_FROM_DOMAIN || "onboarding@resend.dev";
const FROM_NAME = process.env.RESEND_FROM_NAME || "ALT Agency";

export interface SendEmailOptions {
  to: string | string[];
  toName?: string;
  subject: string;
  body: string;
  fromName?: string;
}

export interface SendEmailResult {
  id: string;
  success: boolean;
  error?: string;
}

function bodyToHtml(body: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const html = escaped
    .split("\n\n")
    .map((para) => `<p style="margin:0 0 16px 0;line-height:1.6;">${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:'Inter',Arial,sans-serif;background:#0a0a0f;color:#e5e5e5;margin:0;padding:40px 20px;">
  <div style="max-width:600px;margin:0 auto;background:#111118;border:1px solid #1f1f2e;border-radius:12px;padding:40px;">
    ${html}
    <hr style="border:none;border-top:1px solid #1f1f2e;margin:24px 0;"/>
    <p style="font-size:12px;color:#6b7280;margin:0;">Sent via ALT Agency Platform</p>
  </div>
</body>
</html>`;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const result = await resend.emails.send({
      from: `${options.fromName || FROM_NAME} <${FROM_DOMAIN}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: bodyToHtml(options.body),
      text: options.body,
    });

    if (result.error) {
      return { id: "", success: false, error: result.error.message };
    }

    return { id: result.data?.id ?? "", success: true };
  } catch (err: any) {
    return { id: "", success: false, error: err?.message ?? "Unknown error" };
  }
}

export async function sendBulkEmails(
  emails: Array<{ to: string; toName?: string; subject: string; body: string }>,
  fromName?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const email of emails) {
    const result = await sendEmail({ ...email, fromName });
    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.error) errors.push(result.error);
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  return { sent, failed, errors };
}
