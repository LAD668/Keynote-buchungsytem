import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  admin_code?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RegisterBody;
  const name = body.name?.trim() ?? "";
  const emailRaw = body.email ?? "";
  const password = body.password ?? "";
  const adminCode = body.admin_code?.trim() ?? "";

  if (!name) return jsonError("Name is required");
  if (!emailRaw.trim()) return jsonError("Email is required");
  if (password.length < 8) return jsonError("Password must be at least 8 characters");
  if (!adminCode) return jsonError("Admin code is required");

  const email = normalizeEmail(emailRaw);
  console.log("Starting registration for:", email);

  const supabase = getServiceSupabase();
  if (!supabase) return jsonError("Server auth is not configured", 500);

  const { data: codeRow, error: codeError } = await supabase
    .from("admin_codes")
    .select("code,used_by,expires_at")
    .eq("code", adminCode)
    .maybeSingle();

  if (codeError) return jsonError("Could not validate admin code", 500);
  const expired = codeRow?.expires_at ? new Date(codeRow.expires_at).getTime() < Date.now() : false;
  if (!codeRow || codeRow.used_by || expired) return jsonError("Invalid or already used admin code", 400);

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError || !created.user) {
    return jsonError(createError?.message ?? "Could not create user", 400);
  }

  console.log("User created, generating token...");
  const userId = created.user.id;

  const { error: consumeError } = await supabase
    .from("admin_codes")
    .update({ used_by: userId, used_by_email: email, used_at: new Date().toISOString() })
    .eq("code", adminCode)
    .is("used_by", null);

  if (consumeError) return jsonError("Could not consume admin code", 500);

  await supabase.from("admin_allowlist").upsert({ email }, { onConflict: "email" });

  const token = crypto.randomUUID();
  console.log("Token generated:", token);
  const tokenHash = sha256Hex(token);

  console.log("Storing token in database...");
  const { error: tokenError } = await supabase.from("email_verification_tokens").insert({
    token_hash: tokenHash,
    user_id: userId,
    email,
    used: false,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
  if (tokenError) return jsonError("Could not create verification token", 500);

  console.log("Sending verification email to:", email);
  try {
    const emailResult = await sendVerificationEmail(email, token);
    console.log("Email sent successfully:", emailResult);
  } catch (error) {
    console.error("Email sending failed:", error);
  }

  console.log("Registration complete");

  return NextResponse.json({ success: true }, { status: 200 });
}

