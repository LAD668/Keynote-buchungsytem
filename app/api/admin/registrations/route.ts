import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type Action = "remove" | "set";

type Body = {
  action?: Action;
  ticket_id?: string;
  workshop_id?: string;
  guest_name?: string;
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
  if (!(await requireAdmin())) {
    return jsonError("Unauthorized", 401);
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const action = body.action;
  const ticketId = body.ticket_id?.trim() ?? "";
  const workshopId = body.workshop_id?.trim() ?? "";
  const guestName = body.guest_name?.trim() ?? "";

  if (!action) return jsonError("Action is required");
  if (!ticketId) return jsonError("ticket_id is required");
  if (!workshopId) return jsonError("workshop_id is required");

  const supabase = getServiceSupabase();
  if (!supabase) return jsonError("Server auth is not configured", 500);

  if (guestName) {
    await supabase.from("tickets").upsert({ ticket_id: ticketId, guest_name: guestName }, { onConflict: "ticket_id" });
  }

  if (action === "remove") {
    const { error } = await supabase.from("registrations").delete().eq("ticket_id", ticketId).eq("workshop_id", workshopId);
    if (error) return jsonError("Could not remove participant", 500);
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // action === "set": ensure user has exactly one workshop per slot
  const { data: targetWorkshop, error: wError } = await supabase
    .from("workshops")
    .select("id,time_slot")
    .eq("id", workshopId)
    .maybeSingle();
  if (wError || !targetWorkshop) return jsonError("Workshop not found", 404);

  const slot = (targetWorkshop as { time_slot?: number | null }).time_slot;
  if (slot == null) return jsonError("Workshop slot missing", 500);

  const { data: existing, error: eError } = await supabase
    .from("registrations")
    .select("id,workshop_id,workshops!inner(time_slot)")
    .eq("ticket_id", ticketId);
  if (eError) return jsonError("Could not update participant", 500);

  const toDeleteIds: string[] = [];
  for (const row of (existing ?? []) as Array<{ id: string; workshop_id: string; workshops?: { time_slot?: number | null } }>) {
    const s = row.workshops?.time_slot ?? null;
    if (s === slot && row.workshop_id !== workshopId) {
      toDeleteIds.push(row.id);
    }
  }

  if (toDeleteIds.length > 0) {
    const { error: delError } = await supabase.from("registrations").delete().in("id", toDeleteIds);
    if (delError) return jsonError("Could not update participant", 500);
  }

  const { error: insError } = await supabase.from("registrations").upsert(
    { ticket_id: ticketId, workshop_id: workshopId, time_slot: slot },
    { onConflict: "ticket_id,workshop_id" }
  );
  if (insError) return jsonError(insError.message, 500);

  return NextResponse.json({ success: true }, { status: 200 });
}

