import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

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
  const body = (await request.json().catch(() => ({}))) as { token?: string };
  const token = body.token?.trim() ?? "";
  if (!token) return jsonError("Token is required");

  const supabase = getServiceSupabase();
  if (!supabase) return jsonError("Server auth is not configured", 500);

  const tokenHash = sha256Hex(token);
  const { data: row, error } = await supabase
    .from("email_verification_tokens")
    .select("token_hash,email,user_id,used,expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) return jsonError("Could not verify token", 500);
  if (!row) return jsonError("Invalid or expired token", 400);
  if (row.used) return jsonError("Invalid or expired token", 400);

  const expiresAtMs = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (!expiresAtMs || expiresAtMs < Date.now()) return jsonError("Invalid or expired token", 400);

  const { error: markError } = await supabase
    .from("email_verification_tokens")
    .update({ used: true })
    .eq("token_hash", tokenHash)
    .eq("used", false);
  if (markError) return jsonError("Could not verify token", 500);

  const email = (row.email ?? "").trim().toLowerCase();
  if (!email) return jsonError("Could not verify token", 500);

  await supabase.from("admin_email_verifications").upsert({ email }, { onConflict: "email" });

  const userId = (row as unknown as { user_id?: string | null }).user_id ?? null;
  if (userId) {
    await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

