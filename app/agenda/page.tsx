/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseClient, submitWorkshopFeedback } from "@/lib/supabase";
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

  // Post-workshop feedback modal
  const [wsFeedbackOpen, setWsFeedbackOpen] = useState(false);
  const [wsFeedbackWorkshop, setWsFeedbackWorkshop] = useState<Workshop | null>(null);
  const [wsFeedbackSlot, setWsFeedbackSlot] = useState<TimeSlot | null>(null);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [wsOverall, setWsOverall] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [wsContent, setWsContent] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [wsSpeaker, setWsSpeaker] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [wsRoom, setWsRoom] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [wsTech, setWsTech] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [wsDifficulty, setWsDifficulty] = useState<"too_easy" | "just_right" | "too_complex" | null>(null);
  const [wsPace, setWsPace] = useState<"too_slow" | "good" | "too_fast" | null>(null);
  const [wsCommentsOpen, setWsCommentsOpen] = useState(false);
  const [wsPositive, setWsPositive] = useState("");
  const [wsImprove, setWsImprove] = useState("");
  const [wsSubmitError, setWsSubmitError] = useState("");
  const [wsSubmitting, setWsSubmitting] = useState(false);
  const [wsSuccess, setWsSuccess] = useState(false);
  const [wsSuccessNext, setWsSuccessNext] = useState<string | null>(null);

  const currentSlot = useMemo(getCurrentTimeSlot, []);

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch("/api/settings", { method: "GET", cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as {
        feedback_enabled?: boolean;
        registration_enabled?: boolean;
      };
      setFeedbackEnabled(json.feedback_enabled ?? true);
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

  function draftKey(ticket: string, workshopId: string) {
    return `workshop_feedback_draft_${ticket}_${workshopId}`;
  }
  function sentKey(ticket: string, workshopId: string) {
    return `workshop_feedback_sent_${ticket}_${workshopId}`;
  }

  function resetWsForm() {
    setWsOverall(null);
    setWsContent(null);
    setWsSpeaker(null);
    setWsRoom(null);
    setWsTech(null);
    setWsDifficulty(null);
    setWsPace(null);
    setWsCommentsOpen(false);
    setWsPositive("");
    setWsImprove("");
    setWsSubmitError("");
    setWsSubmitting(false);
    setWsSuccess(false);
    setWsSuccessNext(null);
  }

  function computeNextWorkshopLabel(currentSlot: TimeSlot | null) {
    if (!currentSlot) return null;
    const nextSlot = currentSlot === 1 ? 2 : currentSlot === 2 ? 3 : null;
    if (!nextSlot) return null;
    const nextRow = (grouped[nextSlot] ?? [])[0];
    const w = nextRow?.workshops ?? null;
    if (!w) return null;
    return `${w.title} um ${slotLabel[nextSlot]}`;
  }

  function openWorkshopFeedbackModal(w: Workshop, slot: TimeSlot | null) {
    if (!feedbackEnabled) {
      setError("Feedback ist aktuell deaktiviert.");
      return;
    }
    if (!ticketId) return;
    setWsFeedbackWorkshop(w);
    setWsFeedbackSlot(slot);
    resetWsForm();

    try {
      const raw = window.localStorage.getItem(draftKey(ticketId, w.id));
      if (raw) {
        const d = JSON.parse(raw) as Partial<{
          overall: number;
          content: number;
          speaker: number;
          room: number | null;
          tech: number | null;
          difficulty: "too_easy" | "just_right" | "too_complex" | null;
          pace: "too_slow" | "good" | "too_fast" | null;
          positive: string;
          improve: string;
          commentsOpen: boolean;
        }>;
        if (d.overall) setWsOverall(d.overall as 1 | 2 | 3 | 4 | 5);
        if (d.content) setWsContent(d.content as 1 | 2 | 3 | 4 | 5);
        if (d.speaker) setWsSpeaker(d.speaker as 1 | 2 | 3 | 4 | 5);
        if (typeof d.room === "number") setWsRoom(d.room as 1 | 2 | 3 | 4 | 5);
        if (typeof d.tech === "number") setWsTech(d.tech as 1 | 2 | 3 | 4 | 5);
        if (d.difficulty) setWsDifficulty(d.difficulty);
        if (d.pace) setWsPace(d.pace);
        if (typeof d.positive === "string") setWsPositive(d.positive);
        if (typeof d.improve === "string") setWsImprove(d.improve);
        if (typeof d.commentsOpen === "boolean") setWsCommentsOpen(d.commentsOpen);
      }
    } catch {
      // ignore draft parse errors
    }

    setWsSuccessNext(computeNextWorkshopLabel(slot));
    setWsFeedbackOpen(true);
  }

  function persistDraft() {
    if (!ticketId || !wsFeedbackWorkshop?.id) return;
    const payload = {
      overall: wsOverall,
      content: wsContent,
      speaker: wsSpeaker,
      room: wsRoom,
      tech: wsTech,
      difficulty: wsDifficulty,
      pace: wsPace,
      positive: wsPositive,
      improve: wsImprove,
      commentsOpen: wsCommentsOpen,
    };
    try {
      window.localStorage.setItem(draftKey(ticketId, wsFeedbackWorkshop.id), JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!wsFeedbackOpen) return;
    persistDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsOverall, wsContent, wsSpeaker, wsRoom, wsTech, wsDifficulty, wsPace, wsPositive, wsImprove, wsCommentsOpen, wsFeedbackOpen]);

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

  async function submitWsFeedback() {
    if (!feedbackEnabled) {
      setWsSubmitError("Feedback ist aktuell deaktiviert.");
      return;
    }
    if (!ticketId) {
      setWsSubmitError("Keine Ticket-ID gefunden.");
      return;
    }
    if (!wsFeedbackWorkshop?.id) {
      setWsSubmitError("Workshop fehlt.");
      return;
    }
    if (!wsOverall || !wsContent || !wsSpeaker || !wsDifficulty || !wsPace) {
      setWsSubmitError("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    setWsSubmitting(true);
    setWsSubmitError("");

    const res = await submitWorkshopFeedback({
      ticket_id: ticketId,
      workshop_id: wsFeedbackWorkshop.id,
      overall_rating: wsOverall,
      content_rating: wsContent,
      speaker_rating: wsSpeaker,
      room_rating: wsRoom,
      tech_rating: wsTech,
      difficulty: wsDifficulty,
      pace: wsPace,
      positive_comment: wsPositive.trim() ? wsPositive.trim().slice(0, 500) : null,
      improvement_comment: wsImprove.trim() ? wsImprove.trim().slice(0, 500) : null,
    });

    if (res.error) {
      setWsSubmitError(`Konnte nicht senden: ${res.error}`);
      setWsSubmitting(false);
      return;
    }

    try {
      window.localStorage.setItem(sentKey(ticketId, wsFeedbackWorkshop.id), "1");
      window.localStorage.removeItem(draftKey(ticketId, wsFeedbackWorkshop.id));
    } catch {
      // ignore
    }

    setWsSuccess(true);
    window.setTimeout(() => {
      setWsFeedbackOpen(false);
      setWsSubmitting(false);
    }, 3000);
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
                                    disabled={!feedbackEnabled}
                                    onClick={() => openWorkshopFeedbackModal(w, normalizeSlot(row.time_slot, w.time_slot))}
                                  >
                                    Feedback
                                  </Button>
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

      {wsFeedbackOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#0b1224]/70 p-0 backdrop-blur-sm overflow-y-auto overscroll-contain sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Workshop Feedback"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setWsFeedbackOpen(false);
          }}
        >
          <div className="flex w-full flex-col border border-white/15 bg-[#0f172a]/90 p-0 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,0.55)] overflow-hidden h-[100dvh] rounded-none sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-[600px] sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Workshop Feedback</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-white line-clamp-2">
                  {wsFeedbackWorkshop?.title ?? "Workshop"}
                </h2>
                <p className="mt-1 text-sm text-white/70">
                  {wsFeedbackWorkshop?.speaker ?? "—"}
                  {wsFeedbackWorkshop?.room ? ` · Raum ${wsFeedbackWorkshop.room}` : ""}
                  {wsFeedbackSlot ? ` · ${slotLabel[wsFeedbackSlot]}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWsFeedbackOpen(false)}
                className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:border-white/25 hover:bg-white/10"
                aria-label="Schließen"
                title="Schließen"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 pb-28 [-webkit-overflow-scrolling:touch] overscroll-contain touch-pan-y sm:pb-6">
              {wsSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-14 w-14 rounded-full border border-emerald-300/30 bg-emerald-500/15 grid place-items-center">
                    <span className="text-2xl text-emerald-200">✓</span>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-white">Danke für dein Feedback!</p>
                  <p className="mt-1 text-sm text-white/65">Wir schätzen deine Meinung sehr.</p>
                  {wsSuccessNext ? (
                    <p className="mt-4 text-sm text-white/75">
                      Nächster Workshop: <span className="font-semibold text-white">{wsSuccessNext}</span>
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-5">
                  <RatingStars label="Wie war der Workshop insgesamt?" value={wsOverall} onChange={setWsOverall} required />
                  <RatingStars label="War der Inhalt relevant für dich?" value={wsContent} onChange={setWsContent} required />
                  <RatingStars label="Wie hat der Speaker präsentiert?" value={wsSpeaker} onChange={setWsSpeaker} required />

                  <ChoicePills
                    label="Schwierigkeitsgrad"
                    required
                    value={wsDifficulty}
                    options={[
                      { value: "too_easy", label: "Zu einfach" },
                      { value: "just_right", label: "Genau richtig ✓" },
                      { value: "too_complex", label: "Zu komplex" },
                    ]}
                    onChange={setWsDifficulty}
                  />

                  <ChoicePills
                    label="Tempo des Workshops"
                    required
                    value={wsPace}
                    options={[
                      { value: "too_slow", label: "Zu langsam" },
                      { value: "good", label: "Gut ✓" },
                      { value: "too_fast", label: "Zu schnell" },
                    ]}
                    onChange={setWsPace}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <RatingStars label="War der Raum geeignet?" value={wsRoom} onChange={setWsRoom} />
                    <RatingStars label="Hat die Technik funktioniert?" value={wsTech} onChange={setWsTech} />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <button
                      type="button"
                      className="w-full text-left text-sm font-semibold text-white/85 hover:text-white"
                      onClick={() => setWsCommentsOpen((v) => !v)}
                      aria-expanded={wsCommentsOpen}
                    >
                      Kommentar hinzufügen (optional)
                    </button>

                    {wsCommentsOpen ? (
                      <div className="mt-4 space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-white/80">Was war besonders gut?</label>
                          <textarea
                            value={wsPositive}
                            onChange={(e) => setWsPositive(e.target.value.slice(0, 500))}
                            className="min-h-[80px] w-full resize-y rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30 focus:bg-white/10"
                            maxLength={500}
                          />
                          <p className="text-xs text-white/45">{wsPositive.length}/500</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-white/80">Was könnte besser sein?</label>
                          <textarea
                            value={wsImprove}
                            onChange={(e) => setWsImprove(e.target.value.slice(0, 500))}
                            className="min-h-[80px] w-full resize-y rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30 focus:bg-white/10"
                            maxLength={500}
                          />
                          <p className="text-xs text-white/45">{wsImprove.length}/500</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {wsSubmitError ? (
                    <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100" role="alert">
                      {wsSubmitError}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-white/10 bg-[#0f172a]/95 px-5 py-4">
              <Button
                size="lg"
                className="w-full bg-brand text-white hover:bg-brand/90 sm:w-auto"
                onClick={submitWsFeedback}
                loading={wsSubmitting}
                disabled={wsSuccess}
              >
                Absenden
              </Button>
            </div>
          </div>
        </div>
      ) : null}
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

function RatingStars({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: 1 | 2 | 3 | 4 | 5 | null;
  onChange: (v: 1 | 2 | 3 | 4 | 5 | null) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white/85">
          {label} {required ? <span className="text-rose-200">*</span> : null}
        </p>
        <p className="text-xs text-white/45">{value ? `${value}/5` : required ? "Pflicht" : "Optional"}</p>
      </div>
      <div className="flex items-center gap-2" role="radiogroup" aria-label={label}>
        {([1, 2, 3, 4, 5] as const).map((i) => {
          const active = (value ?? 0) >= i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-white/20",
                active ? "border-amber-300/40 bg-amber-300/15" : "border-white/12 bg-white/5 hover:bg-white/10"
              )}
              role="radio"
              aria-checked={value === i}
              aria-label={`${i} Sterne`}
            >
              <span className={cn("text-2xl leading-none", active ? "text-amber-300" : "text-white/35")}>★</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChoicePills<T extends string>({
  label,
  required,
  value,
  options,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: T | null;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white/85">
          {label} {required ? <span className="text-rose-200">*</span> : null}
        </p>
        <p className="text-xs text-white/45">{value ? "Ausgewählt" : required ? "Pflicht" : "Optional"}</p>
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/20",
                selected ? "border-sky-300/40 bg-brand text-white" : "border-white/12 bg-white/5 text-white/80 hover:bg-white/10"
              )}
              role="radio"
              aria-checked={selected}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
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
