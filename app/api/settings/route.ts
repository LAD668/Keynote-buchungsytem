import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type SettingsResponse = {
  registration_enabled: boolean;
};

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { registration_enabled: true } satisfies SettingsResponse,
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await supabase.from("app_settings").select("key,boolean_value");

  if (error) {
    return NextResponse.json(
      { registration_enabled: true } satisfies SettingsResponse,
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const map = new Map<string, boolean>();
  for (const row of (data ?? []) as Array<{ key: string; boolean_value: boolean }>) {
    map.set(row.key, row.boolean_value);
  }

  return NextResponse.json(
    {
      registration_enabled: map.get("registration_enabled") ?? true,
    } satisfies SettingsResponse,
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

