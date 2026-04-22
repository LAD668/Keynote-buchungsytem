import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const emailRaw = body.email ?? "";
  if (!emailRaw.trim()) return jsonError("Email is required");

  const email = normalizeEmail(emailRaw);
  const supabase = getServiceSupabase();
  if (!supabase) return jsonError("Server auth is not configured", 500);

  const { data: usersRes, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) return jsonError("Could not check user", 500);

  const user = (usersRes.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email) ?? null;
  if (!user) {
    return NextResponse.json({ exists: false, confirmed: false, admin_verified: false, allowlisted: false }, { status: 200 });
  }

  const confirmed = Boolean(user.email_confirmed_at);

  const { data: allowRow } = await supabase.from("admin_allowlist").select("email").eq("email", email).maybeSingle();

  return NextResponse.json(
    {
      exists: true,
      confirmed,
      admin_verified: true,
      allowlisted: Boolean(allowRow),
    },
    { status: 200 }
  );
}

