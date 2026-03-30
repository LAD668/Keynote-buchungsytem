/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";

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

const days = [
  { label: "Freitag · 04. September", value: "2026-09-04" },
  { label: "Samstag · 05. September", value: "2026-09-05" },
] as const;

export default function ProgramPage() {
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [day, setDay] = useState<(typeof days)[number]["value"]>(days[0].value);

  const visible = useMemo(() => {
    return items
      .filter((x) => x.day_date === day)
      .slice()
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [items, day]);

  useEffect(() => {
    const db = getSupabaseClient();
    if (!db) {
      setError("Supabase ist nicht konfiguriert.");
      setLoading(false);
      return;
    }

    async function load(client: SupabaseClient) {
      setLoading(true);
      setError("");

      const { data, error: qError } = await client
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

    load(db);
  }, []);

  return (
    <div className="relative z-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl">Programm</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {days.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDay(d.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  day === d.value
                    ? "border-white/35 bg-white/15 text-white"
                    : "border-white/12 bg-white/5 text-white/75 hover:border-white/25 hover:text-white"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          <Link href="/agenda" className="text-sm font-medium text-sky-200 hover:text-white">
            Zur Agenda
          </Link>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">{error}</p>
      ) : null}

      {loading ? <p className="text-sm text-white/60">Programm wird geladen …</p> : null}

      {!loading ? (
        <div className="space-y-6">
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
              Noch keine Programmpunkte für diesen Tag.
            </div>
          ) : null}

          {visible.map((it, idx) => (
            <div key={it.id} className="grid grid-cols-[76px,1fr] gap-3 sm:grid-cols-[92px,1fr] sm:gap-4">
              <p className="pt-1 text-sm text-white/55">
                {formatTime(it.start_time)}
                {it.end_time ? ` – ${formatTime(it.end_time)}` : ""}
              </p>

              <div className="relative">
                {idx !== visible.length - 1 ? (
                  <span className="absolute left-[8px] top-5 h-[calc(100%+20px)] w-0.5 bg-sky-400/20" aria-hidden />
                ) : null}
                <span className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-white/35 bg-white/10" aria-hidden />

                <div className="ml-7">
                  <Card className={cn("rounded-2xl border-white/15 bg-white/10 p-4 backdrop-blur-md", durationClassName(it))}>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-white">{it.title}</h2>
                      {it.description ? <p className="mt-1 text-sm text-white/70">{it.description}</p> : null}
                      <p className="mt-2 text-sm text-white/55">{formatLocation(it)}</p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatTime(value: string) {
  const v = value.trim();
  return v.length >= 5 ? v.slice(0, 5) : v;
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

