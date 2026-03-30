"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getAdminDashboardData, getSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type TabKey = "top" | "bottom";

type Slot = 1 | 2 | 3;

type WorkshopRow = { id: string; title: string; speaker: string; room: string; time_slot: Slot };
type RegistrationRow = { ticket_id: string; workshop_id: string; time_slot: Slot };

const slotLabel: Record<Slot, string> = {
  1: "10:00 - 11:00",
  2: "11:30 - 12:30",
  3: "13:30 - 14:30",
};

export function AdminDashboard() {
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("top");
  const [liveHint, setLiveHint] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    const { data, error } = await getAdminDashboardData();
    if (error || !data) {
      setError("Dashboard-Daten konnten nicht geladen werden.");
      setLoading(false);
      return;
    }

    setWorkshops(data.workshops);
    setRegistrations(data.registrations);
    setTotalTickets(data.totalTickets);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Realtime: best-effort refresh via Supabase client if available
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel("admin-registrations-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, () => {
        setLiveHint(true);
        window.setTimeout(() => setLiveHint(false), 2500);
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const countByWorkshop = useMemo(() => {
    const counts = new Map<string, number>();
    for (const registration of registrations) {
      counts.set(registration.workshop_id, (counts.get(registration.workshop_id) ?? 0) + 1);
    }
    return counts;
  }, [registrations]);

  const totalParticipants = useMemo(() => {
    return new Set(registrations.map((entry) => entry.ticket_id)).size;
  }, [registrations]);

  const ranked = useMemo(() => {
    return workshops
      .map((w) => ({ workshop: w, count: countByWorkshop.get(w.id) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [workshops, countByWorkshop]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...ranked.map((r) => r.count));
  }, [ranked]);

  const mostPopular = ranked[0] ?? null;
  const top3 = ranked.slice(0, 3);
  const bottom3 = ranked.slice().reverse().slice(0, 3);

  function exportWorkshopCsv(workshop: WorkshopRow) {
    const rows = registrations.filter((entry) => entry.workshop_id === workshop.id);
    const csvLines = [
      ["Ticket-ID", "Workshop", "Time Slot", "Room"].join(","),
      ...rows.map((entry) =>
        [escapeCsv(entry.ticket_id), escapeCsv(workshop.title), escapeCsv(slotLabel[entry.time_slot]), escapeCsv(workshop.room)].join(",")
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${workshop.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-participants.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="text-sm text-white/60">KPIs & Insights in Echtzeit</p>
          </div>
          {liveHint ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
              Neue Buchung eingetroffen
            </span>
          ) : null}
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-white/60">Dashboard wird geladen …</p> : null}

      {/* HERO STATS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-white/15 bg-white/10 p-6 backdrop-blur-md hover:shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Teilnehmer Total
              </p>
              <p className="mt-2 text-4xl font-semibold text-white">{totalParticipants}</p>
              <p className="mt-2 text-sm text-white/60">
                von {totalTickets} verkauften Tickets
              </p>
            </div>
          </div>
          <div className="mt-5">
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-brand transition-all"
                style={{
                  width: `${totalTickets === 0 ? 0 : Math.min(100, Math.round((totalParticipants / totalTickets) * 100))}%`,
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="border-white/15 bg-white/10 p-6 backdrop-blur-md hover:shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
            Beliebtester Workshop
          </p>
          {mostPopular ? (
            <>
              <div className="mt-3 flex items-start justify-between gap-3">
                <p className="text-lg font-semibold text-white">{mostPopular.workshop.title}</p>
                <span className="rounded-full bg-orange-500/20 px-2.5 py-1 text-xs font-semibold text-orange-100 border border-orange-400/30">
                  Top Pick
                </span>
              </div>
              <p className="mt-3 text-4xl font-semibold text-white">{mostPopular.count}</p>
              <p className="mt-2 text-sm text-white/60">
                Raum {mostPopular.workshop.room} · Slot {mostPopular.workshop.time_slot} ({slotLabel[mostPopular.workshop.time_slot]})
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-white/60">—</p>
          )}
        </Card>
      </div>

      {/* WORKSHOP PERFORMANCE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Workshop Performance</h2>
          <div className="flex rounded-2xl border border-white/15 bg-white/5 p-1">
            <TabButton active={tab === "top"} onClick={() => setTab("top")}>
              Top 3
            </TabButton>
            <TabButton active={tab === "bottom"} onClick={() => setTab("bottom")}>
              Bottom 3
            </TabButton>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {(tab === "top" ? top3 : bottom3).map((entry, index) => (
            <WorkshopPerfCard
              key={entry.workshop.id}
              variant={tab === "top" ? "top" : "bottom"}
              rank={index + 1}
              workshop={entry.workshop}
              count={entry.count}
              maxCount={maxCount}
              onExport={() => exportWorkshopCsv(entry.workshop)}
            />
          ))}
        </div>
      </section>

    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition",
        active ? "bg-white/15 text-white" : "text-white/65 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function WorkshopPerfCard({
  variant,
  rank,
  workshop,
  count,
  maxCount,
  onExport,
}: {
  variant: "top" | "bottom";
  rank: number;
  workshop: WorkshopRow;
  count: number;
  maxCount: number;
  onExport: () => void;
}) {
  const percent = Math.round((count / Math.max(1, maxCount)) * 100);
  return (
    <Card
      className={cn(
        "p-6 border-white/15 bg-white/10 backdrop-blur-md hover:shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
        variant === "top" ? "border-l-4 border-l-green-500" : "border-l-4 border-l-orange-500"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/85">
          #{rank}
        </span>
        <button
          type="button"
          onClick={onExport}
          className="rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 hover:bg-white/15"
          title="Export CSV"
          aria-label="Export CSV"
        >
          Export CSV
        </button>
      </div>

      <p className="mt-3 text-base font-semibold text-white">{workshop.title}</p>
      <p className="mt-1 text-sm text-white/70">{workshop.speaker}</p>
      <p className="mt-1 text-sm text-white/55">
        Slot {workshop.time_slot} ({slotLabel[workshop.time_slot]}) · Raum {workshop.room}
      </p>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">Teilnehmer</p>
          <p className="mt-1 text-3xl font-semibold text-white">{count}</p>
        </div>
        <p className="text-sm text-white/55">{percent}%</p>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
      </div>

      {/* Mini-Bar Grafik (visual indicator without icons) */}
      {(() => {
        const bars = 10;
        const filled = Math.round((percent / 100) * bars);
        return (
          <div className="mt-4">
            <div className="flex h-10 items-end justify-between gap-1 rounded-xl bg-white/5 p-2">
              {Array.from({ length: bars }).map((_, i) => {
                const height = i < filled ? 100 : 25;
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-[6%] rounded-md bg-brand/70 transition-all",
                      variant === "top" ? "bg-green-500/70" : "bg-orange-500/70"
                    )}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        );
      })()}
    </Card>
  );
}

