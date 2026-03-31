/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type TimeSlot = 1 | 2 | 3;

type Workshop = {
  id: string;
  title: string;
  speaker: string;
  room: string;
  description?: string | null;
  time_slot?: TimeSlot | null;
  image_url?: string | null;
  speaker_image_url?: string | null;
  chili_level?: number | null;
};

type RegistrationRow = {
  id: string;
  time_slot: TimeSlot | null;
  workshop_id: string;
  workshops: Workshop | null;
};

type ProgramItem = {
  id: string;
  day_date: string;
  start_time: string;
  end_time: string | null;
  title: string;
  description: string | null;
  building: string | null;
  floor: number | null;
  room: string | null;
};

function isWorkshopSlotPlaceholder(it: ProgramItem) {
  return it.title.startsWith("WORKSHOP_SLOT_");
}

const slotLabel: Record<TimeSlot, string> = {
  1: "10:00 - 11:00",
  2: "11:30 - 12:30",
  3: "13:30 - 14:30",
};

export default function AgendaPage() {
  const [ticketId, setTicketId] = useState("");
  const [guestName, setGuestName] = useState<string | null>(null);
  const [items, setItems] = useState<RegistrationRow[]>([]);
  const [programAll, setProgramAll] = useState<ProgramItem[]>([]);
  const [program, setProgram] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const currentSlot = useMemo(getCurrentTimeSlot, []);

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch("/api/settings", { method: "GET", cache: "no-store" });
      await res.json().catch(() => ({}));
    }
    loadSettings();

    const storedTicketId = window.localStorage.getItem("ticket_id") ?? "";
    setTicketId(storedTicketId);

    const client = getSupabaseClient();
    if (!client) {
      setError("Supabase ist nicht konfiguriert.");
      setLoading(false);
      return;
    }
    if (!storedTicketId) {
      setError("Keine Ticket-ID gefunden.");
      setLoading(false);
      return;
    }

    async function loadAgenda() {
      setLoading(true);
      setError("");

      const db = client;
      if (!db) {
        setError("Supabase ist nicht konfiguriert.");
        setLoading(false);
        return;
      }

      const [ticketRow, registrations, programItems] = await Promise.all([
        db
          .from("tickets")
          .select("guest_name")
          .eq("ticket_id", storedTicketId)
          .maybeSingle(),
        db
          .from("registrations")
          .select(
            "id,time_slot,workshop_id,workshops(id,title,speaker,room,description,time_slot,image_url,speaker_image_url,chili_level)"
          )
          .eq("ticket_id", storedTicketId)
          .order("time_slot", { ascending: true }),
        db
          .from("program_items")
          .select("id,day_date,start_time,end_time,title,description,building,floor,room")
          .order("day_date", { ascending: true })
          .order("start_time", { ascending: true }),
      ]);

      if (registrations.error) {
        setError("Agenda konnte nicht geladen werden.");
        setLoading(false);
        return;
      }
      if (programItems.error) {
        setError("Programm konnte nicht geladen werden.");
        setLoading(false);
        return;
      }

      if (ticketRow.data) {
        const gn = (ticketRow.data as { guest_name?: string | null }).guest_name?.trim();
        setGuestName(gn || null);
      } else {
        setGuestName(null);
      }

      setItems((registrations.data ?? []) as unknown as RegistrationRow[]);
      const allProgram = (programItems.data ?? []) as unknown as ProgramItem[];
      setProgramAll(allProgram);

      const nextProgram = allProgram.filter((it) => !isWorkshopSlotPlaceholder(it));
      setProgram(nextProgram);
      setLoading(false);
    }

    loadAgenda();

    const programChannel = client
      .channel("agenda-program-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "program_items" }, () => {
        loadAgenda();
      })
      .subscribe();

    const registrationsChannel = client
      .channel("agenda-registrations-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, () => {
        loadAgenda();
      })
      .subscribe();

    const workshopsChannel = client
      .channel("agenda-workshops-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "workshops" }, () => {
        loadAgenda();
      })
      .subscribe();

    return () => {
      client.removeChannel(programChannel);
      client.removeChannel(registrationsChannel);
      client.removeChannel(workshopsChannel);
    };
  }, []);

  const grouped = useMemo(() => {
    const slots: Record<TimeSlot, RegistrationRow[]> = { 1: [], 2: [], 3: [] };
    for (const row of items) {
      const slot = normalizeSlot(row.time_slot, row.workshops?.time_slot);
      if (!slot || !row.workshops) continue;
      slots[slot].push(row);
    }
    return slots;
  }, [items]);

  const programDays = useMemo(
    () =>
      [
        { value: "2026-09-04", label: "Fr 04.09." },
        { value: "2026-09-05", label: "Sa 05.09." },
      ] as const,
    []
  );

  const programByDay = useMemo(() => {
    const map: Record<string, ProgramItem[]> = {};
    for (const d of programDays) map[d.value] = [];
    for (const it of program) {
      if (!map[it.day_date]) map[it.day_date] = [];
      map[it.day_date].push(it);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [program, programDays]);

  const programAllByDay = useMemo(() => {
    const map: Record<string, ProgramItem[]> = {};
    for (const d of programDays) map[d.value] = [];
    for (const it of programAll) {
      if (!map[it.day_date]) map[it.day_date] = [];
      map[it.day_date].push(it);
    }
    return map;
  }, [programAll, programDays]);

  const todayLocal = useMemo(() => getLocalDateString(), []);
  const activeProgramDay = useMemo(() => {
    const match = programDays.find((d) => d.value === todayLocal);
    return match?.value ?? programDays[0].value;
  }, [programDays, todayLocal]);

  const hasItems = items.length > 0;
  const name = guestName || "Gast";

  // Feedback completely removed

  async function handleRemove(item: RegistrationRow) {
    const workshopTitle = item.workshops?.title ?? "Workshop";
    const confirmed = window.confirm(`"${workshopTitle}" aus deiner Agenda entfernen?`);
    if (!confirmed) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    setRemovingId(item.id);
    setError("");

    const { error: deleteError } = await supabase
      .from("registrations")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      const msg = deleteError.message.toLowerCase();
      const friendly =
        msg.includes("row-level security") ||
        msg.includes("rls") ||
        msg.includes("policy") ||
        msg.includes("permission")
          ? "Anmeldung ist aktuell deaktiviert."
          : "Workshop konnte nicht entfernt werden.";
      setError(friendly);
      setRemovingId(null);
      return;
    }

    setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    setRemovingId(null);
  }

 

  return (
    <div className="relative z-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Hallo {name}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
            {maskTicketId(ticketId)}
          </span>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {loading ? <p className="text-sm text-white/60">Agenda wird geladen …</p> : null}

      {!loading ? (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-left text-lg font-semibold text-white">Programm</h2>
          </div>

          {programAll.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
              Noch keine Programmpunkte
            </div>
          ) : (
            <div className="space-y-6">
              {programDays
                .filter((d) => (programAllByDay[d.value] ?? []).length > 0)
                .map((d) => {
                  const list = programByDay[d.value] ?? [];
                  const isActive = activeProgramDay === d.value;

                  return (
                    <div key={d.value} className="space-y-3">
                      <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", isActive ? "text-sky-200" : "text-white/55")}>
                        {d.label}
                      </p>

                      <div className="space-y-3">
                        {list.map((it, idx) => (
                          <div key={it.id} className="grid grid-cols-[76px,1fr] gap-3 sm:grid-cols-[92px,1fr] sm:gap-4">
                            <p className={cn("pt-1 text-sm", isActive ? "text-sky-200" : "text-white/55")}>
                              {formatTime(it.start_time)}
                              {it.end_time ? ` – ${formatTime(it.end_time)}` : ""}
                            </p>

                            <div className="relative">
                              {idx !== list.length - 1 ? (
                                <span className="absolute left-[8px] top-5 h-[calc(100%+20px)] w-0.5 bg-sky-400/20" aria-hidden />
                              ) : null}

                              <span
                                className={cn(
                                  "absolute left-0 top-1 h-4 w-4 rounded-full border-2",
                                  isActive ? "border-sky-300 bg-sky-400" : "border-white/35 bg-white/10"
                                )}
                                aria-hidden
                              />

                              <div className="ml-7">
                                <Card className="rounded-2xl border-white/15 bg-white/10 p-3 backdrop-blur-md">
                                  <p className="text-base font-semibold text-white">{it.title}</p>
                                  {it.description ? <p className="mt-1 text-sm text-white/70">{it.description}</p> : null}
                                  <p className="mt-2 text-sm text-white/55">{formatProgramLocation(it)}</p>
                                </Card>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : null}

      {!loading && hasItems ? (
        <div className="space-y-5">
          {([1, 2, 3] as const).map((slot, idx) => {
            const slotRows = grouped[slot];
            const isActive = currentSlot === slot;

            return (
              <div key={slot} className="grid grid-cols-[76px,1fr] gap-3 sm:grid-cols-[92px,1fr] sm:gap-4">
                <p className={cn("pt-1 text-sm", isActive ? "text-sky-200" : "text-white/55")}>
                  {slotLabel[slot]}
                </p>

                <div className="relative">
                  {idx !== 2 ? (
                    <span className="absolute left-[8px] top-5 h-[calc(100%+20px)] w-0.5 bg-sky-400/20" aria-hidden />
                  ) : null}

                  <span
                    className={cn(
                      "absolute left-0 top-1 h-4 w-4 rounded-full border-2",
                      isActive ? "border-sky-300 bg-sky-400" : "border-white/35 bg-white/10"
                    )}
                    aria-hidden
                  />

                  <div className="ml-7 space-y-3">
                    {slotRows.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
                        Kein Workshop in diesem Slot
                      </div>
                    ) : null}

                    {slotRows.map((row) => {
                      const w = row.workshops;
                      if (!w) return null;
                      const chili = clampChili(w.chili_level);
                      const isKeynote = w.title.toLowerCase().includes("keynote");

                      return (
                        <Card
                          key={row.id}
                          className="overflow-hidden rounded-2xl border-white/15 bg-white/10 p-0 backdrop-blur-md"
                        >
                          <div className="flex items-stretch gap-3 p-3">
                            <WorkshopImage imageUrl={w.image_url} title={w.title} />

                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white">
                                  {w.title}
                                </h3>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/85">
                                    {slotLabel[slot]}
                                  </span>
                                  {isKeynote ? (
                                    <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-200">
                                      Keynote
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <p className="line-clamp-2 text-xs leading-relaxed text-white/70">
                                {w.description ? w.description : `Raum: ${w.room}`}
                              </p>

                              <div className="flex items-center gap-2">
                                <SpeakerAvatar name={w.speaker} imageUrl={w.speaker_image_url ?? null} />
                                <p className="truncate text-xs font-medium text-white/90">
                                  {w.speaker}
                                </p>
                              </div>

                              <div className="flex items-end justify-between gap-3 pt-1">
                                <ChiliScale level={chili} />
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/90 hover:bg-white/10 hover:text-white"
                                    onClick={() => handleRemove(row)}
                                    loading={removingId === row.id}
                                  >
                                    Entfernen
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Feedback removed */}
    </div>
  );
}

function normalizeSlot(slotA: TimeSlot | null, slotB: TimeSlot | null | undefined): TimeSlot | null {
  const s = slotA ?? slotB ?? null;
  if (s === 1 || s === 2 || s === 3) return s;
  return null;
}

function getCurrentTimeSlot(): TimeSlot | null {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  if (minutes >= 10 * 60 && minutes < 11 * 60) return 1;
  if (minutes >= 11 * 60 + 30 && minutes < 12 * 60 + 30) return 2;
  if (minutes >= 13 * 60 + 30 && minutes < 14 * 60 + 30) return 3;
  return null;
}

function maskTicketId(ticketId: string) {
  if (!ticketId) return "---";
  if (ticketId.length < 6) return `${ticketId.slice(0, 1)}***`;
  return `${ticketId.slice(0, 3)}***${ticketId.slice(-2)}`;
}

function clampChili(n: number | null | undefined): 1 | 2 | 3 {
  if (n === 1 || n === 2 || n === 3) return n;
  return 2;
}

function ChiliScale({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex flex-col gap-0.5" aria-label={`Chilischoten Intensität ${level} von 3`}>
      <div className="flex items-center gap-0.5">
        {([1, 2, 3] as const).map((i) => (
          <span
            key={i}
            className={cn(
              "text-lg leading-none transition-opacity",
              i <= level
                ? "opacity-100 drop-shadow-[0_0_6px_rgba(239,68,68,0.55)]"
                : "opacity-[0.22]"
            )}
            aria-hidden
          >
            🌶
          </span>
        ))}
      </div>
    </div>
  );
}

function WorkshopImage({ imageUrl, title }: { imageUrl?: string | null; title: string }) {
  const src = imageUrl?.trim();

  return (
    <div
      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-800/60"
      aria-hidden={false}
      title={title}
    >
      {src && (src.startsWith("http://") || src.startsWith("https://")) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : src && src.startsWith("/") ? (
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 20vw, 80px"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-600/90 via-slate-800/80 to-slate-950/95" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
    </div>
  );
}

function SpeakerAvatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Speaker Profilbild" className="h-full w-full object-cover" />
      ) : (
        initials || "•"
      )}
    </div>
  );
}

function formatTime(value: string) {
  const v = value.trim();
  return v.length >= 5 ? v.slice(0, 5) : v;
}

function formatProgramLocation(it: ProgramItem) {
  const parts = [it.building, it.floor != null ? `Stock ${it.floor}` : null, it.room].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function getLocalDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}
