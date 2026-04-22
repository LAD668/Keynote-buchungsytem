import { Resend } from "resend";
import { sendVerificationEmail } from "@/lib/email";

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
  const result = await sendVerificationEmail(email, token);
  if (!result.success) {
    throw new Error("Could not send verification email.");
  }
}

