/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type ProgramItem = {
  id: string;
  day_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string | null;
  title: string;
  description: string | null;
  building: string | null;
  floor: number | null;
  room: string | null;
};

const days = [
  { label: "Freitag: 04. September", value: "2026-09-04" },
  { label: "Samstag: 05. September", value: "2026-09-05" },
] as const;

const buildingOptions = ["Hauptgebäude", "Annexgebäude"] as const;
type Building = (typeof buildingOptions)[number];

const floorsByBuilding: Record<Building, number[]> = {
  "Hauptgebäude": [0, 1, 2],
  "Annexgebäude": [-1, 0, 1, 2],
};

const roomsByLocation: Record<Building, Record<number, string[]>> = {
  "Hauptgebäude": {
    0: ["W001", "W002", "W003", "W004", "W005", "W006", "W008", "W009", "W010", "W011", "W012", "W013"],
    1: ["W101", "W103", "W105", "W106", "W107", "W108", "W109", "W110", "W111", "W112", "W113", "W115"],
    2: ["W201", "W202", "W203", "W204", "W205", "W206", "W207", "W208", "W209", "W210", "W212", "W213"],
  },
  "Annexgebäude": {
    [-1]: ["A1"],
    0: ["A2", "A3"],
    1: ["A4", "A5"],
    2: ["A6"],
  },
};

const defaultBuilding: Building = buildingOptions[0];
const defaultFloor = floorsByBuilding[defaultBuilding][0] ?? 0;
const defaultRoom = roomsByLocation[defaultBuilding][defaultFloor]?.[0] ?? "W001";
const timeOptions = buildTimeOptions();

export default function AdminProgramPage() {
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDay, setFormDay] = useState<(typeof days)[number]["value"]>(days[0].value);
  const [formStart, setFormStart] = useState("10:00");
  const [formEnd, setFormEnd] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBuilding, setFormBuilding] = useState<Building>(defaultBuilding);
  const [formFloor, setFormFloor] = useState<number>(defaultFloor);
  const [formRoom, setFormRoom] = useState<string>(defaultRoom);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const endTimeOptions = useMemo(() => {
    return timeOptions.filter((value) => toMinutes(value) > toMinutes(formStart));
  }, [formStart]);

  const grouped = useMemo(() => {
    const map = new Map<string, ProgramItem[]>();
    for (const d of days) map.set(d.value, []);
    for (const it of items) {
      if (!map.has(it.day_date)) map.set(it.day_date, []);
      map.get(it.day_date)!.push(it);
    }
    for (const [k, v] of Array.from(map.entries())) {
      v.sort((a, b) => a.start_time.localeCompare(b.start_time));
      map.set(k, v);
    }
    return map;
  }, [items]);

  const todayLocal = useMemo(getLocalDateString, []);
  const activeDayValue = useMemo(() => {
    return days.find((d) => d.value === todayLocal)?.value ?? days[0].value;
  }, [todayLocal]);

  async function loadData() {
    setLoading(true);
    setError("");

    const db = getSupabaseClient();
    if (!db) {
      setError("Supabase ist nicht konfiguriert.");
      setLoading(false);
      return;
    }

    const { data, error: qError } = await db
      .from("program_items")
      .select("id,day_date,start_time,end_time,title,description,building,floor,room")
      .order("day_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (qError) {
      setError("Programm konnte nicht geladen werden.");
      setLoading(false);
      return;
    }

    setItems((data ?? []) as ProgramItem[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!createOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCreateOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createOpen]);

  function resetForm() {
    setFormDay(days[0].value);
    setFormStart("10:00");
    setFormEnd("");
    setFormTitle("");
    setFormDescription("");
    setFormBuilding(defaultBuilding);
    setFormFloor(defaultFloor);
    setFormRoom(defaultRoom);
    setFormSubmitting(false);
    setFormError("");
  }

  useEffect(() => {
    if (!formStart) return;
    if (!formEnd || toMinutes(formEnd) <= toMinutes(formStart)) {
      const candidate = endTimeOptions[1] ?? endTimeOptions[0] ?? "";
      setFormEnd(candidate);
    }
  }, [formStart, formEnd, endTimeOptions]);

  function openCreateModal() {
    setEditingId(null);
    resetForm();
    setCreateOpen(true);
  }

  function openEditModal(it: ProgramItem) {
    setEditingId(it.id);

    const dayValue = days.find((d) => d.value === it.day_date)?.value ?? days[0].value;
    const buildingValue = it.building && buildingOptions.includes(it.building as Building) ? (it.building as Building) : defaultBuilding;

    const floorValue =
      typeof it.floor === "number" && floorsByBuilding[buildingValue]?.includes(it.floor) ? it.floor : defaultFloor;

    const roomCandidates = roomsByLocation[buildingValue]?.[floorValue] ?? [];
    const roomValue = it.room && roomCandidates.includes(it.room) ? it.room : roomCandidates[0] ?? defaultRoom;

    setFormDay(dayValue);
    setFormStart(formatTimeInput(it.start_time));
    setFormEnd(it.end_time ? formatTimeInput(it.end_time) : "");
    setFormTitle(it.title);
    setFormDescription(it.description ?? "");
    setFormBuilding(buildingValue);
    setFormFloor(floorValue);
    setFormRoom(roomValue);
    setFormSubmitting(false);
    setFormError("");
    setCreateOpen(true);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const db = getSupabaseClient();
    if (!db) {
      setFormError("Supabase ist nicht konfiguriert.");
      return;
    }

    const title = formTitle.trim();
    if (title.length < 2) {
      setFormError("Bitte einen Titel eingeben.");
      return;
    }
    if (!formStart.trim()) {
      setFormError("Bitte eine Startzeit wählen.");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        day_date: formDay,
        start_time: toTime(formStart),
        end_time: formEnd.trim() ? toTime(formEnd) : null,
        title,
        description: formDescription.trim() ? formDescription.trim() : null,
        building: formBuilding ?? null,
        floor: Number.isFinite(formFloor) ? formFloor : null,
        room: formRoom?.trim() ? formRoom.trim() : null,
      };

      const { error: saveError } = editingId
        ? await db.from("program_items").update(payload).eq("id", editingId)
        : await db.from("program_items").insert(payload);

      if (saveError) {
        setFormError(`Konnte nicht speichern: ${saveError.message}`);
        return;
      }
      setCreateOpen(false);
      setEditingId(null);
      resetForm();
      await loadData();
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Programmpunkt wirklich entfernen?");
    if (!confirmed) return;

    const db = getSupabaseClient();
    if (!db) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    const { error: delError } = await db.from("program_items").delete().eq("id", id);
    if (delError) {
      setError("Konnte nicht entfernen.");
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="relative space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl">Programm</h1>
          <p className="text-sm text-white/60">Freitag + Samstag — sichtbar für Besucher</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="mt-2 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-xl font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:brightness-110 active:scale-[0.99]"
          aria-label="Programmpunkt hinzufügen"
          title="Programmpunkt hinzufügen"
        >
          +
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">{error}</p>
      ) : null}
      {loading ? <p className="text-sm text-white/60">Lade Programm …</p> : null}

      {!loading ? (
        <div className="space-y-6">
          {days.map((d) => {
            const list = grouped.get(d.value) ?? [];
            const isActive = activeDayValue === d.value;

            return (
              <div key={d.value} className="space-y-4">
                <p className={cn("pt-1 text-sm", isActive ? "text-sky-200" : "text-white/55")}>{d.label}</p>

                {(() => {
                  if (list.length === 0) {
                    return (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
                        Kein Programmpunkt an diesem Tag
                      </div>
                    );
                  }

                  return list.map((it, idx) => (
                    <div key={it.id} className="grid grid-cols-[92px,1fr] gap-4">
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
                          <Card className={cn("rounded-2xl border-white/15 bg-white/10 p-4 backdrop-blur-md", durationClassName(it))}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <h2 className="text-lg font-semibold text-white">{it.title}</h2>
                                {it.description ? <p className="mt-1 text-sm text-white/70">{it.description}</p> : null}
                                <p className="mt-2 text-sm text-white/55">{formatLocation(it)}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(it)}
                                  className="rounded-xl border border-white/15 bg-white/5 p-2 text-white/80 transition hover:border-white/25 hover:bg-white/10"
                                  aria-label="Bearbeiten"
                                  title="Bearbeiten"
                                >
                                  <IconPencil />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(it.id)}
                                  className="rounded-xl border border-white/15 bg-white/5 p-2 text-white/80 transition hover:border-white/25 hover:bg-white/10"
                                  aria-label="Entfernen"
                                  title="Entfernen"
                                >
                                  <IconTrash />
                                </button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            );
          })}
        </div>
      ) : null}

      {createOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1224]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Neuer Programmpunkt"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreateOpen(false);
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md [-webkit-overflow-scrolling:touch] overscroll-contain"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  {editingId ? "Programmpunkt bearbeiten" : "Neuen Programmpunkt hinzufügen"}
                </h2>
                <p className="mt-1 text-sm text-white/60">Wird automatisch bei Besuchern angezeigt</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:border-white/25 hover:bg-white/10"
              >
                Schließen
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Tag</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as (typeof days)[number]["value"])}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10"
                  >
                    {days.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Titel</label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30 focus:bg-white/10"
                    placeholder="Titel"
                    maxLength={140}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Start</label>
                  <select
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10"
                    required
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Ende (optional)</label>
                  <select
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10"
                  >
                    <option value="">Kein Ende</option>
                    {endTimeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/80">Beschreibung (optional)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="min-h-[90px] w-full resize-y rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30 focus:bg-white/10"
                  placeholder="Beschreibung"
                  maxLength={1200}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Gebäude</label>
                  <select
                    value={formBuilding}
                    onChange={(e) => {
                      const nextBuilding = e.target.value as Building;
                      setFormBuilding(nextBuilding);
                      const nextFloor = floorsByBuilding[nextBuilding]?.[0] ?? 0;
                      setFormFloor(nextFloor);
                      const nextRoom = roomsByLocation[nextBuilding]?.[nextFloor]?.[0] ?? "";
                      setFormRoom(nextRoom);
                    }}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10"
                  >
                    {buildingOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Stock</label>
                  <select
                    value={formFloor}
                    onChange={(e) => {
                      const nextFloor = Number(e.target.value);
                      setFormFloor(nextFloor);
                      const nextRoom = roomsByLocation[formBuilding]?.[nextFloor]?.[0] ?? "";
                      setFormRoom(nextRoom);
                    }}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10"
                  >
                    {floorsByBuilding[formBuilding].map((f) => (
                      <option key={f} value={f}>
                        {f === -1 ? "Untergeschoss" : f === 0 ? "Erdgeschoss" : `${f}. Obergeschoss`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Raum</label>
                  <select
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10"
                  >
                    {(roomsByLocation[formBuilding]?.[formFloor] ?? []).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError ? (
                <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100" role="alert">
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={formSubmitting}
                className={cn(
                  "w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:brightness-110 active:scale-[0.99]",
                  formSubmitting ? "opacity-60" : ""
                )}
              >
                {formSubmitting ? "Speichern …" : "Speichern"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function toTime(value: string) {
  const v = value.trim();
  if (!v) return v;
  // Supabase TIME can accept "HH:MM" but we normalize.
  return v.length === 5 ? `${v}:00` : v;
}

function formatTime(value: string) {
  const v = value.trim();
  return v.length >= 5 ? v.slice(0, 5) : v;
}

function formatTimeInput(value: string) {
  // db returns "HH:MM:SS", UI expects "HH:MM"
  return formatTime(value);
}

function formatLocation(it: ProgramItem) {
  const floorLabel =
    it.floor == null ? null : it.floor === -1 ? "Untergeschoss" : it.floor === 0 ? "Erdgeschoss" : `${it.floor}. Obergeschoss`;
  const parts = [it.building, floorLabel, it.room].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function toMinutes(value: string) {
  const [h, m] = value.split(":");
  return (Number(h) || 0) * 60 + (Number(m) || 0);
}

function buildTimeOptions() {
  const out: string[] = [];
  for (let h = 0; h < 24; h += 1) {
    for (let m = 0; m < 60; m += 15) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
}

function durationClassName(it: ProgramItem) {
  const start = toMinutes(formatTime(it.start_time));
  const end = it.end_time ? toMinutes(formatTime(it.end_time)) : start + 30;
  const duration = Math.max(15, end - start);
  if (duration >= 90) return "min-h-40";
  if (duration >= 60) return "min-h-32";
  if (duration >= 45) return "min-h-28";
  if (duration >= 30) return "min-h-24";
  return "min-h-20";
}

function getLocalDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 7h15M9 7V5.5A2 2 0 0 1 11 3.5h2A2 2 0 0 1 15 5.5V7M7.5 7l1 14h7l1-14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12.7 6.3l5 5M4.5 19.5l4.2-1 10.3-10.3a2.1 2.1 0 0 0 0-3l-.2-.2a2.1 2.1 0 0 0-3 0L5.5 15.3l-1 4.2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

