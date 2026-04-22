import { Resend } from "resend";

export async function sendVerificationEmail(email: string, token: string) {
  console.log("[EMAIL] Sending to:", email);
  console.log("[EMAIL] API Key exists:", !!process.env.RESEND_API_KEY);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }

  const baseUrl = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
  const verifyUrl = `${baseUrl}/admin/verify?token=${encodeURIComponent(token)}`;

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "Dänk Symposium <noreply@daenksymposium.app>",
      to: email,
      subject: "Verify your Admin Account - Dänk Symposium",
      html: `
          <!DOCTYPE html>
          <html>
            <body>
              <h1>Welcome!</h1>
              <p>
                Click to verify:
                <a href="${verifyUrl}">Verify Account</a>
              </p>
            </body>
          </html>
      `,
    });

    if (error) {
      console.error("[EMAIL] Resend error:", error);
      throw error;
    }

    console.log("[EMAIL] Success! ID:", (data as { id?: string } | null | undefined)?.id);
    return { success: true, id: (data as { id?: string } | null | undefined)?.id };
  } catch (error) {
    console.error("[EMAIL] Exception:", error);
    throw error;
  }
}

