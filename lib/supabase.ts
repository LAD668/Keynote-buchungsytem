import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

function isValidSupabaseUrl(value: string | undefined) {
  if (!value) {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const hasValidConfig = isValidSupabaseUrl(supabaseUrl) && Boolean(supabaseAnonKey);

const supabase = hasValidConfig ? createClient(supabaseUrl as string, supabaseAnonKey as string) : null;

export function getSupabaseClient() {
  return supabase;
}

function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }
  return supabase;
}

export type VerifyTicketResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "not_found" | "database"; message?: string };

export async function verifyTicket(ticket_id: string): Promise<VerifyTicketResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, reason: "not_configured" };
  }

  const { data, error } = await client
    .from("tickets")
    .select("ticket_id")
    .eq("ticket_id", ticket_id)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: "database", message: error.message };
  }

  if (!data) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true };
}

export async function getWorkshops() {
  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from("workshops")
      .select("id,title,speaker,room,time_slot,description")
      .order("time_slot", { ascending: true })
      .order("title", { ascending: true });

    if (error) {
      return { data: null, error: `Could not load workshops: ${error.message}` };
    }

    return { data: data ?? [], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { data: null, error: message };
  }
}

export async function getUserRegistrations(ticket_id: string) {
  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from("registrations")
      .select("id,ticket_id,workshop_id,created_at,workshops(id,title,speaker,room,time_slot,description)")
      .eq("ticket_id", ticket_id)
      .order("created_at", { ascending: true });

    if (error) {
      return { data: null, error: `Could not load registrations: ${error.message}` };
    }

    return { data: data ?? [], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { data: null, error: message };
  }
}

export async function saveRegistration(ticket_id: string, workshop_id: string) {
  try {
    const client = requireSupabase();
    const { data: workshop, error: workshopError } = await client
      .from("workshops")
      .select("id,time_slot")
      .eq("id", workshop_id)
      .maybeSingle();

    if (workshopError || !workshop) {
      return { data: null, error: "Workshop not found." };
    }

    const { data: existingForSlot, error: existingError } = await client
      .from("registrations")
      .select("id,workshop_id,workshops!inner(time_slot)")
      .eq("ticket_id", ticket_id);

    if (existingError) {
      return { data: null, error: `Could not check existing registrations: ${existingError.message}` };
    }

    const sameSlotRegistration = (existingForSlot ?? []).find((entry) => {
      const workshopRow = entry.workshops as { time_slot?: number } | Array<{ time_slot?: number }>;
      const slot = Array.isArray(workshopRow) ? workshopRow[0]?.time_slot : workshopRow?.time_slot;
      return slot === workshop.time_slot;
    });

    if (sameSlotRegistration && sameSlotRegistration.workshop_id !== workshop_id) {
      const { error: deleteError } = await client
        .from("registrations")
        .delete()
        .eq("id", sameSlotRegistration.id);

      if (deleteError) {
        return { data: null, error: `Could not replace slot registration: ${deleteError.message}` };
      }
    }

    const { data, error } = await client
      .from("registrations")
      .upsert({ ticket_id, workshop_id }, { onConflict: "ticket_id,workshop_id" })
      .select("id,ticket_id,workshop_id,created_at")
      .maybeSingle();

    if (error) {
      return { data: null, error: `Could not save registration: ${error.message}` };
    }

    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { data: null, error: message };
  }
}

export async function removeRegistration(ticket_id: string, workshop_id: string) {
  try {
    const client = requireSupabase();
    const { error } = await client
      .from("registrations")
      .delete()
      .eq("ticket_id", ticket_id)
      .eq("workshop_id", workshop_id);

    if (error) {
      return { data: null, error: `Could not remove registration: ${error.message}` };
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { data: null, error: message };
  }
}

export async function getAdminStats() {
  try {
    const client = requireSupabase();
    const [workshopsResult, registrationsResult] = await Promise.all([
      client.from("workshops").select("id,title"),
      client.from("registrations").select("ticket_id,workshop_id"),
    ]);

    if (workshopsResult.error) {
      return { data: null, error: `Could not load workshops: ${workshopsResult.error.message}` };
    }
    if (registrationsResult.error) {
      return { data: null, error: `Could not load registrations: ${registrationsResult.error.message}` };
    }

    const workshops = workshopsResult.data ?? [];
    const registrations = registrationsResult.data ?? [];

    const uniqueParticipants = new Set(registrations.map((entry) => entry.ticket_id));
    const totalRegisteredParticipants = uniqueParticipants.size;
    const totalBookings = registrations.length;
    const averageBookingsPerParticipant =
      totalRegisteredParticipants === 0 ? 0 : totalBookings / totalRegisteredParticipants;

    const countByWorkshop = new Map<string, number>();
    for (const entry of registrations) {
      countByWorkshop.set(entry.workshop_id, (countByWorkshop.get(entry.workshop_id) ?? 0) + 1);
    }

    const mostPopularWorkshop =
      workshops
        .slice()
        .sort((a, b) => (countByWorkshop.get(b.id) ?? 0) - (countByWorkshop.get(a.id) ?? 0))[0]?.title ?? null;

    return {
      data: {
        totalRegisteredParticipants,
        totalBookings,
        averageBookingsPerParticipant,
        mostPopularWorkshop,
      },
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { data: null, error: message };
  }
}

type AdminWorkshopRow = {
  id: string;
  title: string;
  speaker: string;
  room: string;
  time_slot: 1 | 2 | 3;
};

type AdminRegistrationRow = {
  ticket_id: string;
  workshop_id: string;
  time_slot: 1 | 2 | 3;
};

export type AdminDashboardData = {
  workshops: AdminWorkshopRow[];
  registrations: AdminRegistrationRow[];
  totalTickets: number;
};

export async function getAdminDashboardData(): Promise<{ data: AdminDashboardData | null; error: string | null }> {
  try {
    const client = requireSupabase();
    const [workshopsResult, registrationsResult, ticketsCountResult] = await Promise.all([
      client.from("workshops").select("id,title,speaker,room,time_slot"),
      client.from("registrations").select("ticket_id,workshop_id,time_slot"),
      client.from("tickets").select("id", { count: "exact", head: true }),
    ]);

    if (workshopsResult.error) {
      return { data: null, error: `Could not load workshops: ${workshopsResult.error.message}` };
    }
    if (registrationsResult.error) {
      return { data: null, error: `Could not load registrations: ${registrationsResult.error.message}` };
    }
    if (ticketsCountResult.error) {
      return { data: null, error: `Could not load tickets count: ${ticketsCountResult.error.message}` };
    }

    return {
      data: {
        workshops: (workshopsResult.data ?? []) as AdminWorkshopRow[],
        registrations: (registrationsResult.data ?? []) as AdminRegistrationRow[],
        totalTickets: ticketsCountResult.count ?? 0,
      },
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { data: null, error: message };
  }
}

// Feedback removed (workshop_feedback helpers deleted)
