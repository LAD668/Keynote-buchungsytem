/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type SubmissionRow = {
  id: string;
  kind: "event" | "workshop";
  workshop_id: string | null;
  created_at: string;
  workshops?: { id: string; title: string } | null;
};

type AnswerRow = {
  id: string;
  submission_id: string;
  question_key: string;
  answer_type: "rating" | "nps" | "choice" | "text";
  rating: number | null;
  nps: number | null;
  choice: string | null;
  text: string | null;
  created_at: string;
};

type WorkshopAgg = { workshop_id: string; title: string; avg: number; count: number; keynote: boolean };

export default function AdminFeedbackPage() {
  const [tab, setTab] = useState<"event" | "workshop">("event");
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    const db = getSupabaseClient();
    if (!db) {
      setError("Supabase ist nicht konfiguriert.");
      setLoading(false);
      return;
    }

    const [subRes, ansRes] = await Promise.all([
      db
        .from("feedback_submissions")
        .select("id,kind,workshop_id,created_at,workshops(id,title)")
        .order("created_at", { ascending: false }),
      db
        .from("feedback_answers")
        .select("id,submission_id,question_key,answer_type,rating,nps,choice,text,created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (subRes.error || ansRes.error) {
      setError("Feedback konnte nicht geladen werden.");
      setLoading(false);
      return;
    }

    setSubmissions((subRes.data ?? []) as unknown as SubmissionRow[]);
    setAnswers((ansRes.data ?? []) as unknown as AnswerRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const submissionsById = useMemo(() => {
    const map = new Map<string, SubmissionRow>();
    for (const s of submissions) map.set(s.id, s);
    return map;
  }, [submissions]);

  const answersForTab = useMemo(() => {
    const tabSubmissionIds = new Set(submissions.filter((s) => s.kind === tab).map((s) => s.id));
    return answers.filter((a) => tabSubmissionIds.has(a.submission_id));
  }, [answers, submissions, tab]);

  const eventStats = useMemo(() => {
    const eventSubs = submissions.filter((s) => s.kind === "event");
    const eventIds = new Set(eventSubs.map((s) => s.id));
    const a = answers.filter((x) => eventIds.has(x.submission_id));

    const avgRating = avgOf(a.filter((x) => x.question_key === "event.overall" && x.rating != null).map((x) => x.rating!));
    const nps = computeNps(a.filter((x) => x.question_key === "event.nps" && x.nps != null).map((x) => x.nps!));
    return { count: eventSubs.length, avgRating, nps };
  }, [answers, submissions]);

  const workshopAgg = useMemo(() => {
    const workshopSubs = submissions.filter((s) => s.kind === "workshop" && s.workshop_id);
    const byWorkshop = new Map<string, { title: string; sum: number; count: number }>();

    for (const sub of workshopSubs) {
      const workshopId = sub.workshop_id!;
      const title = sub.workshops?.title ?? "Workshop";
      const ratingAnswer = answers.find((a) => a.submission_id === sub.id && a.question_key === "workshop.overall");
      const r = ratingAnswer?.rating ?? null;
      if (r == null) continue;

      const entry = byWorkshop.get(workshopId) ?? { title, sum: 0, count: 0 };
      entry.sum += r;
      entry.count += 1;
      entry.title = title;
      byWorkshop.set(workshopId, entry);
    }

    const list: WorkshopAgg[] = Array.from(byWorkshop.entries()).map(([id, v]) => ({
      workshop_id: id,
      title: v.title,
      avg: v.count === 0 ? 0 : v.sum / v.count,
      count: v.count,
      keynote: v.title.toLowerCase().includes("keynote"),
    }));

    list.sort((a, b) => b.avg - a.avg);
    return list;
  }, [answers, submissions]);

  const top3 = workshopAgg.slice(0, 3);
  const bottom3 = workshopAgg.slice().sort((a, b) => a.avg - b.avg).slice(0, 3);
  const totalSubmissions = submissions.length;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl">Feedback</h1>
        <p className="text-sm text-white/60">Event / Workshops</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("event")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition",
            tab === "event"
              ? "border-white/35 bg-white/15 text-white"
              : "border-white/12 bg-white/5 text-white/75 hover:border-white/25 hover:text-white"
          )}
        >
          Event
        </button>
        <button
          type="button"
          onClick={() => setTab("workshop")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition",
            tab === "workshop"
              ? "border-white/35 bg-white/15 text-white"
              : "border-white/12 bg-white/5 text-white/75 hover:border-white/25 hover:text-white"
          )}
        >
          Workshops
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">{error}</p>
      ) : null}
      {loading ? <p className="text-sm text-white/60">Lade Feedback …</p> : null}

      {!loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-2xl border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Total</p>
            <p className="mt-2 text-3xl font-semibold text-white">{totalSubmissions}</p>
            <p className="mt-1 text-sm text-white/60">Submissions</p>
          </Card>

          <Card className="rounded-2xl border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Event Ø</p>
            <p className="mt-2 text-3xl font-semibold text-white">{eventStats.avgRating ? eventStats.avgRating.toFixed(1) : "—"}</p>
            <p className="mt-1 text-sm text-white/60">{eventStats.count} Einträge</p>
          </Card>

          <Card className="rounded-2xl border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">NPS</p>
            <p className="mt-2 text-3xl font-semibold text-white">{eventStats.nps != null ? `${eventStats.nps}` : "—"}</p>
            <p className="mt-1 text-sm text-white/60">0–10</p>
          </Card>
        </div>
      ) : null}

      {!loading && tab === "event" ? (
        <Card className="rounded-2xl border-white/15 bg-white/10 p-5 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Event Fragen (Ø)</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Metric label="Räume gut?" value={avgQuestion(answersForTab, "event.rooms_good")} />
            <Metric label="Orientierung klar?" value={avgQuestion(answersForTab, "event.signage_clear")} />
            <Metric label="Zeitslots gut?" value={avgQuestion(answersForTab, "event.timeslots_good")} />
            <Metric label="Pausen/Verpflegung" value={avgQuestion(answersForTab, "event.breaks_catering")} />
          </div>
        </Card>
      ) : null}

      {!loading && tab === "workshop" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="rounded-2xl border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Top 3</p>
            <div className="mt-4 space-y-3">
              {top3.length === 0 ? (
                <p className="text-sm text-white/55">Noch kein Workshop-Feedback</p>
              ) : (
                top3.map((w) => <WorkshopRow key={w.workshop_id} w={w} tone="good" />)
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Bottom 3</p>
            <div className="mt-4 space-y-3">
              {bottom3.length === 0 ? (
                <p className="text-sm text-white/55">Noch kein Workshop-Feedback</p>
              ) : (
                bottom3.map((w) => <WorkshopRow key={w.workshop_id} w={w} tone="bad" />)
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {!loading ? (
        <Card className="rounded-2xl border-white/15 bg-white/10 p-5 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Letzte Kommentare</p>
          <div className="mt-4 space-y-3">
            {answers
              .filter((a) => a.answer_type === "text" && (a.text ?? "").trim().length > 0)
              .slice(0, 8)
              .map((a) => {
                const sub = submissionsById.get(a.submission_id);
                return (
              <div key={a.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                  {sub?.kind === "workshop" ? "Workshop" : "Event"} · {a.question_key}
                </p>
                <p className="mt-2 text-sm text-white/85">{a.text}</p>
                {sub?.kind === "workshop" ? (
                  <p className="mt-2 text-sm text-white/55">{sub.workshops?.title ?? "Workshop"}</p>
                ) : null}
              </div>
            );
              })}
            {answers.filter((a) => a.answer_type === "text" && (a.text ?? "").trim().length > 0).length === 0 ? (
              <p className="text-sm text-white/55">Noch keine Kommentare</p>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function avgOf(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeNps(values: number[]) {
  if (!values.length) return null;
  const promoters = values.filter((v) => v >= 9).length;
  const detractors = values.filter((v) => v <= 6).length;
  const total = values.length;
  return Math.round(((promoters - detractors) / total) * 100);
}

function avgQuestion(answers: AnswerRow[], key: string) {
  const vals = answers.filter((a) => a.question_key === key && a.rating != null).map((a) => a.rating as number);
  const v = avgOf(vals);
  return v ? v.toFixed(1) : "—";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function WorkshopRow({ w, tone }: { w: WorkshopAgg; tone: "good" | "bad" }) {
  const pct = Math.round((Math.min(5, Math.max(0, w.avg)) / 5) * 100);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white line-clamp-2">{w.title}</p>
          <p className="mt-1 text-sm text-white/55">
            Ø {w.avg.toFixed(1)} · {w.count} Feedback{w.keynote ? " · Keynote" : ""}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider",
            tone === "good" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-rose-400/30 bg-rose-500/10 text-rose-100"
          )}
        >
          {w.avg.toFixed(1)}
        </span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-white/10">
        <div className={cn("h-2 rounded-full", tone === "good" ? "bg-emerald-400/80" : "bg-rose-400/80")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

