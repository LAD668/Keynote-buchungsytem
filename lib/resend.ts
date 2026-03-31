import { Resend } from "resend";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function getResend() {
  const key = requireEnv("RESEND_API_KEY");
  return new Resend(key);
}

export async function sendAdminVerificationEmail(email: string, token: string) {
  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL");
  const verifyUrl = `${appUrl}/admin/verify?token=${encodeURIComponent(token)}`;

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: "Dänk Symposium <noreply@daenksymposium.app>",
    to: email,
    subject: "Verify your Admin Account - Dänk Symposium",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; line-height: 1.6; color: #111; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 40px auto; background: white;">
            <div style="background: #5B6FE5; color: white; padding: 28px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Dänk Symposium</h1>
            </div>
            <div style="padding: 28px 20px; background: #f9fafb; border-radius: 0 0 10px 10px;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px;">Welcome Admin!</h2>
              <p style="margin: 0 0 18px 0; color: #374151;">Click the button below to verify your admin account:</p>
              <div style="text-align: center; margin: 18px 0 14px;">
                <a href="${verifyUrl}" style="display: inline-block; padding: 12px 22px; background: #5B6FE5; color: white; text-decoration: none; border-radius: 8px; font-weight: 700;">
                  Verify Account
                </a>
              </div>
              <p style="margin: 18px 0 0; color: #6b7280; font-size: 13px;">
                Or copy this link:<br />
                <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-top: 6px;">
                  ${verifyUrl}
                </span>
              </p>
              <p style="margin: 18px 0 0; color: #9ca3af; font-size: 12px;">This link expires in 24 hours.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    throw new Error("Could not send verification email.");
  }
}

