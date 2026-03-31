import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type SettingsResponse = {
  registration_enabled: boolean;
};

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.trim();
  if (!email) return false;

  const { data: isAdmin, error } = await supabase.rpc("is_admin", { p_email: email });
  if (error) return false;
  return Boolean(isAdmin);
}

function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function getAnonSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function readSettings(): Promise<SettingsResponse> {
  const supabase = getAnonSupabase() ?? getServiceSupabase();
  if (!supabase) return { registration_enabled: true };

  const { data, error } = await supabase.from("app_settings").select("key,boolean_value");
  if (error) {
    return { registration_enabled: true };
  }
  const map = new Map<string, boolean>();
  for (const row of (data ?? []) as Array<{ key: string; boolean_value: boolean }>) {
    map.set(row.key, row.boolean_value);
  }
  return {
    registration_enabled: map.get("registration_enabled") ?? true,
  };
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await readSettings();
  return NextResponse.json(settings, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<SettingsResponse>;
  const nextRegistration = typeof body.registration_enabled === "boolean" ? body.registration_enabled : null;

  if (nextRegistration == null) {
    return NextResponse.json({ error: "No settings provided." }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase service role key missing. Set SUPABASE_SERVICE_ROLE_KEY in your .env (server-side only) and restart the dev server.",
      },
      { status: 500 }
    );
  }

  const rows: Array<{ key: string; boolean_value: boolean }> = [];
  if (nextRegistration != null) rows.push({ key: "registration_enabled", boolean_value: nextRegistration });

  const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings = await readSettings();
  return NextResponse.json(settings, { status: 200, headers: { "Cache-Control": "no-store" } });
}

