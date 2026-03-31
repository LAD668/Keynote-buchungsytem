import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type Body = {
  query?: string;
  limit?: number;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return jsonError("Unauthorized", 401);

  const body = (await request.json().catch(() => ({}))) as Body;
  const q = (body.query ?? "").trim();
  const limit = Math.max(1, Math.min(20, Math.floor(body.limit ?? 8)));

  if (q.length < 2) return NextResponse.json({ tickets: [] as Array<{ ticket_id: string; guest_name: string | null }> });

  const supabase = getServiceSupabase();
  if (!supabase) return jsonError("Server auth is not configured", 500);

  const pattern = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const { data, error } = await supabase
    .from("tickets")
    .select("ticket_id,guest_name")
    .or(`ticket_id.ilike.${pattern},guest_name.ilike.${pattern}`)
    .order("ticket_id", { ascending: true })
    .limit(limit);

  if (error) return jsonError("Could not search tickets", 500);

  return NextResponse.json({
    tickets: (data ?? []) as Array<{ ticket_id: string; guest_name: string | null }>,
  });
}

