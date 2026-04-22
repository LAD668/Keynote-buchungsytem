import { sendVerificationEmail } from "@/lib/email";

export async function sendAdminVerificationEmail(email: string, token: string) {
  const result = await sendVerificationEmail(email, token);
  if (!result.success) {
    throw new Error("Could not send verification email.");
  }
}

