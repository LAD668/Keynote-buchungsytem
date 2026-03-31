"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { getSupabaseClient, saveRegistration } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type TimeSlot = 1 | 2 | 3;

type Workshop = {
  id: string;
  title: string;
  speaker: string;
  room: string;
  description?: string | null;
  time_slot: TimeSlot;
  image_url?: string | null;
  speaker_image_url?: string | null;
  chili_level?: number | null;
};

const slotLabels: Record<TimeSlot, string> = {
  1: "10:00 – 11:00",
  2: "11:30 – 12:30",
  3: "13:30 – 14:30",
};

export function WorkshopGrid() {
  const [ticketId, setTicketId] = useState("");
  const [guestName, setGuestName] = useState<string | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedBySlot, setSelectedBySlot] = useState<Partial<Record<TimeSlot, string>>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<Partial<Record<TimeSlot, boolean>>>({});
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState<"all" | TimeSlot>("all");
  const [details, setDetails] = useState<Workshop | null>(null);

  const selectedCount = useMemo(
    () => Object.values(selectedBySlot).filter(Boolean).length,
    [selectedBySlot]
  );

  const filteredWorkshops = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workshops.filter((w) => {
      if (slotFilter !== "all" && w.time_slot !== slotFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      const hay = `${w.title} ${w.speaker} ${w.description ?? ""} ${w.room}`.toLowerCase();
      return hay.includes(q);
    });
  }, [workshops, search, slotFilter]);

  useEffect(() => {
    async function loadSettings() {
      await fetch("/api/settings", { method: "GET", cache: "no-store" }).catch(() => null);
    }

    loadSettings();

    const savedTicketId = window.localStorage.getItem("ticket_id") ?? "";
    setTicketId(savedTicketId);

    const client = getSupabaseClient();
    if (!client) {
      setError("Supabase ist nicht konfiguriert.");
      setLoading(false);
      return;
    }

    if (!savedTicketId) {
      setError("Keine Ticket-ID gefunden.");
      setLoading(false);
      return;
    }

    async function loadData() {
      const db = client;
      if (!db) {
        return;
      }

      setLoading(true);
      setError("");

      const workshopsResult = await db
        .from("workshops")
        .select("id,title,speaker,room,description,time_slot,image_url,speaker_image_url,chili_level")
        .order("time_slot")
        .order("title");

      if (workshopsResult.error) {
        setError(`Workshops konnten nicht geladen werden: ${workshopsResult.error.message}`);
        setLoading(false);
        return;
      }

      setWorkshops((workshopsResult.data ?? []) as Workshop[]);

      const [ticketRow, registrationsResult] = await Promise.all([
        db.from("tickets").select("guest_name").eq("ticket_id", savedTicketId).maybeSingle(),
        db.from("registrations").select("workshop_id,time_slot").eq("ticket_id", savedTicketId),
      ]);

      if (!ticketRow.error && ticketRow.data) {
        const gn = (ticketRow.data as { guest_name?: string | null }).guest_name?.trim();
        setGuestName(gn || null);
      } else {
        setGuestName(null);
      }

      if (registrationsResult.error) {
        setError(`Registrierungen konnten nicht geladen werden: ${registrationsResult.error.message}`);
        setSelectedBySlot({});
        setLoading(false);
        return;
      }

      const nextSelection: Partial<Record<TimeSlot, string>> = {};
      for (const entry of registrationsResult.data ?? []) {
        const slot = entry.time_slot as TimeSlot;
        if (slot === 1 || slot === 2 || slot === 3) {
          nextSelection[slot] = entry.workshop_id as string;
        }
      }
      setSelectedBySlot(nextSelection);
      setLoading(false);
    }

    loadData();

    const workshopsChannel = client
      .channel("visitor-workshops-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "workshops" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      client.removeChannel(workshopsChannel);
    };
  }, []);

  async function handleSelect(workshop: Workshop) {
    const slot = workshop.time_slot;
    const prevSelected = selectedBySlot[slot];
    setSelectedBySlot((prev) => ({ ...prev, [slot]: workshop.id }));

    if (!ticketId) {
      return;
    }

    setSavingSlot((prev) => ({ ...prev, [slot]: true }));
    setError("");

    const result = await saveRegistration(ticketId, workshop.id);
    if (result.error) {
      const msg = result.error.toLowerCase();
      const friendly =
        msg.includes("row-level security") ||
        msg.includes("rls") ||
        msg.includes("policy") ||
        msg.includes("permission")
          ? "Anmeldung ist aktuell deaktiviert."
          : result.error;
      setError(friendly);
      setSelectedBySlot((prev) => {
        const next = { ...prev };
        if (prevSelected) {
          next[slot] = prevSelected;
        } else {
          delete next[slot];
        }
        return next;
      });
    }

    setSavingSlot((prev) => ({ ...prev, [slot]: false }));
  }

  const displayName = guestName || "Gast";

  useEffect(() => {
    if (!details) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDetails(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [details]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-4 sm:space-y-5">
        <h1 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Hallo {displayName}
        </h1>

        <div className="space-y-2">
          <label htmlFor="workshop-search" className="sr-only">
            Workshop suchen
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" aria-hidden>
              <SearchIcon />
            </span>
            <input
              id="workshop-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Workshop suchen …"
              className="w-full rounded-2xl border border-white/15 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none ring-white/20 backdrop-blur-md focus:border-white/30 focus:ring-2 focus:ring-white/15"
            />
          </div>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <FilterChip active={slotFilter === "all"} onClick={() => setSlotFilter("all")}>
            Alle
          </FilterChip>
          {([1, 2, 3] as const).map((slot) => (
            <FilterChip key={slot} active={slotFilter === slot} onClick={() => setSlotFilter(slot)}>
              Slot {slot} · {slotLabels[slot]}
            </FilterChip>
          ))}
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">{error}</p>
      ) : null}

      {/* settings debug removed */}

      {loading ? <p className="text-sm text-white/60">Workshops werden geladen …</p> : null}

      {!loading && filteredWorkshops.length === 0 ? (
        <p className="text-sm text-white/60">Keine Workshops für diese Filter.</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredWorkshops.map((workshop) => {
          const isSelected = selectedBySlot[workshop.time_slot] === workshop.id;
          const chili = clampChili(workshop.chili_level);

          return (
            <article
              key={workshop.id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDetails(workshop);
                }
              }}
              onClick={() => setDetails(workshop)}
              className={cn(
                "overflow-hidden rounded-2xl border transition-colors transition-shadow duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-200/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]",
                isSelected
                  ? "border-sky-300/70 bg-white/15 shadow-[0_0_0_1px_rgba(125,211,252,0.35)] hover:border-sky-300/95 hover:bg-white/20 hover:shadow-[0_0_0_1px_rgba(125,211,252,0.55),0_18px_60px_rgba(0,0,0,0.35)]"
                  : "border-white/12 bg-white/[0.07] hover:border-white/20 hover:bg-white/[0.1] hover:shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
              )}
            >
              <div className="flex items-stretch gap-3 p-3 sm:p-4">
                {/* Links: Headerbild (Viereck) */}
                <WorkshopCardImage imageUrl={workshop.image_url} title={workshop.title} />

                <div className="min-w-0 flex-1 space-y-2">
                  {/* Titel + Slot (klein) */}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold leading-snug text-white line-clamp-2">
                      {workshop.title}
                    </h2>
                    <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/85">
                      {slotLabels[workshop.time_slot]}
                    </span>
                  </div>

                  {/* Untertitel (Kurzbeschreibung) */}
                  {workshop.description ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/70">
                      {workshop.description}
                    </p>
                  ) : (
                    <p className="text-xs italic text-white/35">Keine Kurzbeschreibung</p>
                  )}

                  {/* Profilbild + Person */}
                  <div className="flex items-center gap-2">
                    <SpeakerAvatar name={workshop.speaker} imageUrl={workshop.speaker_image_url ?? null} />
                    <p className="truncate text-xs font-medium text-white/90">{workshop.speaker}</p>
                  </div>

                  {/* Chillishoten */}
                  <div className="flex items-end justify-between gap-3 pt-1">
                    <ChiliScale level={chili} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(workshop);
                      }}
                      disabled={!!savingSlot[workshop.time_slot]}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition outline-none focus-visible:ring-2 focus-visible:ring-sky-200/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]",
                        isSelected
                          ? "border-sky-300/60 bg-sky-400/20 text-sky-100"
                          : "border-white/25 bg-white/10 text-white/90 hover:bg-white/15"
                      )}
                    >
                      {savingSlot[workshop.time_slot] ? "…" : isSelected ? "Gewählt" : "Wählen"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/65">{selectedCount} von 3 Slots mit Workshop belegt</p>
        {selectedCount >= 1 ? (
          <Link
            href="/agenda"
            className="inline-flex justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/15"
          >
            Zur Agenda
          </Link>
        ) : null}
      </div>

      {details ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 overflow-y-auto overscroll-contain sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Workshop Details"
          onMouseDown={() => setDetails(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#0f172a]/70 backdrop-blur-md shadow-[0_30px_90px_rgba(0,0,0,0.6)] max-h-[calc(100dvh-2rem)] flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="relative h-32 bg-slate-800/60">
              <WorkshopDetailImage imageUrl={details.image_url} title={details.title} />
            </div>

            <div className="flex-1 overflow-y-auto p-5 [-webkit-overflow-scrolling:touch] overscroll-contain">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/85">
                    {slotLabels[details.time_slot]}
                  </span>
                  <h2 className="mt-2 line-clamp-2 text-xl font-semibold text-white">
                    {details.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setDetails(null)}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/85 hover:bg-white/15"
                  aria-label="Close"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DetailPill label="Zeit" value={slotLabels[details.time_slot]} />
                <DetailPill label="Ort" value={details.room} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <SpeakerAvatar name={details.speaker} imageUrl={details.speaker_image_url ?? null} />
                <div className="min-w-[8rem]">
                  <p className="text-sm font-semibold text-white">{details.speaker}</p>
                  <p className="text-xs text-white/55">Speaker</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                  Kurzbeschreibung
                </p>
                <p className="text-sm leading-relaxed text-white/70">
                  {details.description ? details.description : "—"}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45 mb-2">
                    Chilischoten
                  </div>
                  <ChiliScale level={clampChili(details.chili_level)} />
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(details)}
                  disabled={!!savingSlot[details.time_slot]}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-wide transition",
                    selectedBySlot[details.time_slot] === details.id
                      ? "border-sky-300/60 bg-sky-400/20 text-sky-100"
                      : "border-white/25 bg-white/10 text-white/90 hover:bg-white/15"
                  )}
                >
                  {savingSlot[details.time_slot] ? "…" : selectedBySlot[details.time_slot] === details.id ? "Gewählt" : "Wählen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WorkshopCardImage({
  imageUrl,
  title,
}: {
  imageUrl?: string | null;
  title: string;
}) {
  const src = imageUrl?.trim();
  return (
    <div
      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-800/50"
      aria-hidden={false}
      title={title}
    >
      {src && (src.startsWith("http://") || src.startsWith("https://")) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : src && src.startsWith("/") ? (
        <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 768px) 20vw, 80px" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-600/90 via-slate-800/80 to-slate-950/95" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
      <span className="sr-only">{title}</span>
    </div>
  );
}

function WorkshopDetailImage({
  imageUrl,
  title,
}: {
  imageUrl?: string | null;
  title: string;
}) {
  const src = imageUrl?.trim();

  if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <span className="sr-only">{title}</span>
      </>
    );
  }

  if (src && src.startsWith("/")) {
    return (
      <>
        <Image src={src} alt="" fill className="object-cover" priority={false} sizes="100vw" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <span className="sr-only">{title}</span>
      </>
    );
  }

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-600/90 via-slate-800/80 to-slate-950/95" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
      <span className="sr-only">{title}</span>
    </>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-white/35 bg-white/15 text-white"
          : "border-white/12 bg-white/5 text-white/75 hover:border-white/25 hover:text-white"
      )}
    >
      {children}
    </button>
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
              "text-base leading-none transition-opacity",
              i <= level ? "opacity-100 drop-shadow-[0_0_6px_rgba(239,68,68,0.55)]" : "opacity-[0.22]"
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

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-white/85" title={value}>
        {value}
      </p>
    </div>
  );
}

function clampChili(n: number | null | undefined): 1 | 2 | 3 {
  if (n === 1 || n === 2 || n === 3) {
    return n;
  }
  return 2;
}

function SearchIcon() {
  return <Search size={18} aria-hidden="true" />;
}
