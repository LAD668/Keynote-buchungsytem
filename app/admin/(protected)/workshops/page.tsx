"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, RefreshCw, Settings, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Slot = 1 | 2 | 3;
type ChiliLevel = 1 | 2 | 3;
type WorkshopRow = {
  id: string;
  title: string;
  speaker: string;
  room: string;
  time_slot: Slot;
  building: Building | null;
  floor: number | null;
  time_label: string | null;
  description: string | null;
  image_url: string | null;
  speaker_image_url: string | null;
  chili_level: ChiliLevel | null;
};

type RegistrationRow = {
  workshop_id: string;
};

const slotLabel: Record<Slot, string> = {
  1: "10:00 - 11:00",
  2: "11:30 - 12:30",
  3: "13:30 - 14:30",
};

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

const defaultBuilding = buildingOptions[0];
const defaultFloor = floorsByBuilding[defaultBuilding][0] ?? 0;
const defaultRoom = roomsByLocation[defaultBuilding][defaultFloor]?.[0] ?? "W001";

const WORKSHOP_MEDIA_BUCKET = "workshop-media";
const SPEAKER_AVATAR_BUCKET = "speaker-avatars";

export default function AdminWorkshopsPage() {
  const [slot, setSlot] = useState<"all" | Slot>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [workshops, setWorkshops] = useState<WorkshopRow[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailWorkshop, setDetailWorkshop] = useState<WorkshopRow | null>(null);
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participantError, setParticipantError] = useState("");
  const [participants, setParticipants] = useState<Array<{ ticket_id: string | null; created_at: string | null; tickets?: { guest_name?: string | null } | null }>>(
    []
  );
  const [participantActionLoading, setParticipantActionLoading] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addTicketId, setAddTicketId] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [addSearchLoading, setAddSearchLoading] = useState(false);
  const [addSearchError, setAddSearchError] = useState("");
  const [addSearchResults, setAddSearchResults] = useState<Array<{ ticket_id: string; guest_name: string | null }>>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  const [formSlot, setFormSlot] = useState<Slot>(1);
  const [formTimeLabel, setFormTimeLabel] = useState<string>(slotLabel[1]);
  const [formBuilding, setFormBuilding] = useState<Building>(defaultBuilding);
  const [formFloor, setFormFloor] = useState<number>(defaultFloor);
  const [formRoom, setFormRoom] = useState<string>(defaultRoom);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);

  const [formSpeakerImageFile, setFormSpeakerImageFile] = useState<File | null>(null);
  const [formSpeakerImagePreview, setFormSpeakerImagePreview] = useState<string | null>(null);
  const [formSpeakerImageUrl, setFormSpeakerImageUrl] = useState<string | null>(null);

  const [formSpeaker, setFormSpeaker] = useState("");
  const [formChiliLevel, setFormChiliLevel] = useState<ChiliLevel>(2);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const speakerInitials = useMemo(() => getInitials(formSpeaker), [formSpeaker]);

  useEffect(() => {
    setFormTimeLabel(slotLabel[formSlot]);
  }, [formSlot]);

  async function openWorkshopDetail(workshop: WorkshopRow) {
    setDetailWorkshop(workshop);
    setDetailOpen(true);
    setParticipantError("");
    setParticipants([]);
    setParticipantLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setParticipantError("Supabase ist nicht konfiguriert.");
      setParticipantLoading(false);
      return;
    }

    const { data, error: pError } = await supabase
      .from("registrations")
      .select("ticket_id,created_at,tickets(guest_name)")
      .eq("workshop_id", workshop.id)
      .order("created_at", { ascending: true });

    if (pError) {
      setParticipantError(pError.message);
      setParticipantLoading(false);
      return;
    }

    setParticipants(
      (data ?? []) as Array<{ ticket_id: string | null; created_at: string | null; tickets?: { guest_name?: string | null } | null }>
    );
    setParticipantLoading(false);
  }

  async function removeParticipant(ticketId: string, workshopId: string) {
    setParticipantError("");
    setParticipantActionLoading(`remove:${ticketId}`);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", ticket_id: ticketId, workshop_id: workshopId }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setParticipantError(json.error ?? "Teilnehmer konnte nicht entfernt werden.");
        setParticipantActionLoading(null);
        return;
      }
      if (detailWorkshop) await openWorkshopDetail(detailWorkshop);
      await loadData();
    } finally {
      setParticipantActionLoading(null);
    }
  }

  async function setParticipantWorkshop(ticketId: string, workshopId: string, guestName?: string) {
    setParticipantError("");
    setParticipantActionLoading(`set:${ticketId}`);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", ticket_id: ticketId, workshop_id: workshopId, guest_name: guestName?.trim() ?? "" }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setParticipantError(json.error ?? "Teilnehmer konnte nicht verschoben werden.");
        setParticipantActionLoading(null);
        return;
      }
      if (detailWorkshop) await openWorkshopDetail(detailWorkshop);
      await loadData();
    } finally {
      setParticipantActionLoading(null);
    }
  }

  useEffect(() => {
    if (!addOpen) return;

    const q = addSearch.trim();
    if (q.length < 2) {
      setAddSearchResults([]);
      setAddSearchError("");
      setAddSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setAddSearchLoading(true);
      setAddSearchError("");
      try {
        const res = await fetch("/api/admin/tickets/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, limit: 8 }),
          signal: controller.signal,
        });
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
          tickets?: Array<{ ticket_id: string; guest_name: string | null }>;
        };
        if (!res.ok) {
          setAddSearchError(json.error ?? "Suche fehlgeschlagen.");
          setAddSearchResults([]);
          setAddSearchLoading(false);
          return;
        }
        setAddSearchResults(json.tickets ?? []);
        setAddSearchLoading(false);
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        setAddSearchError("Suche fehlgeschlagen.");
        setAddSearchResults([]);
        setAddSearchLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [addOpen, addSearch]);

  function resetCreateForm() {
    setFormSlot(1);
    setFormTimeLabel(slotLabel[1]);
    setFormBuilding(defaultBuilding);
    setFormFloor(defaultFloor);
    setFormRoom(defaultRoom);

    setFormTitle("");
    setFormDescription("");

    if (formImagePreview) URL.revokeObjectURL(formImagePreview);
    if (formSpeakerImagePreview) URL.revokeObjectURL(formSpeakerImagePreview);
    setFormImageFile(null);
    setFormImagePreview(null);
    setFormImageUrl(null);
    setFormSpeakerImageFile(null);
    setFormSpeakerImagePreview(null);
    setFormSpeakerImageUrl(null);

    setFormSpeaker("");
    setFormChiliLevel(2);
    setFormError("");
    setFormSuccess("");
    setFormSubmitting(false);
  }

  const filtered = useMemo(() => {
    const list = slot === "all" ? workshops : workshops.filter((w) => w.time_slot === slot);
    return list
      .map((w) => ({ workshop: w, count: counts.get(w.id) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [workshops, counts, slot]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...filtered.map((x) => x.count));
  }, [filtered]);

  async function loadData() {
    setLoading(true);
    setError("");

    const client = getSupabaseClient();
    if (!client) {
      setError("Supabase ist nicht konfiguriert.");
      setLoading(false);
      return;
    }

    const [workshopsResult, registrationsResult] = await Promise.all([
      client
        .from("workshops")
        .select("id,title,speaker,room,time_slot,building,floor,time_label,description,image_url,speaker_image_url,chili_level"),
      client.from("registrations").select("workshop_id"),
    ]);

    if (workshopsResult.error) {
      setError("Workshops konnten nicht geladen werden.");
      setLoading(false);
      return;
    }
    if (registrationsResult.error) {
      setError("Registrierungen konnten nicht geladen werden.");
      setLoading(false);
      return;
    }

    const list = (workshopsResult.data ?? []) as WorkshopRow[];
    const regs = (registrationsResult.data ?? []) as RegistrationRow[];
    const next = new Map<string, number>();
    for (const r of regs) {
      if (!r.workshop_id) continue;
      next.set(r.workshop_id, (next.get(r.workshop_id) ?? 0) + 1);
    }

    setWorkshops(list);
    setCounts(next);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateWorkshop(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const client = getSupabaseClient();
    if (!client) {
      setFormError("Supabase ist nicht konfiguriert.");
      return;
    }

    const title = formTitle.trim();
    const speaker = formSpeaker.trim();
    const description = formDescription.trim();

    if (title.length < 2) {
      setFormError("Bitte einen gültigen Titel eingeben (mindestens 2 Zeichen).");
      return;
    }
    if (speaker.length < 2) {
      setFormError("Bitte den Speaker-Namen eingeben.");
      return;
    }

    if (!formRoom.trim()) {
      setFormError("Bitte einen Raum auswählen.");
      return;
    }

    setFormSubmitting(true);
    try {
      // Upload files first (optional)
      const randomBase =
        typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      let uploadedWorkshopImageUrl = formImageUrl;
      let uploadedSpeakerImageUrl = formSpeakerImageUrl;

      if (formImageFile) {
        const objectPath = `workshops/${randomBase}-workshop-${formImageFile.name.replace(/[^\w.-]+/g, "_")}`;
        const { error: uploadError } = await client.storage.from(WORKSHOP_MEDIA_BUCKET).upload(objectPath, formImageFile, {
          upsert: true,
          contentType: formImageFile.type || undefined,
        });
        if (uploadError) {
          setFormError(`Workshop-Bild konnte nicht hochgeladen werden: ${uploadError.message}`);
          return;
        }
        const { data } = client.storage.from(WORKSHOP_MEDIA_BUCKET).getPublicUrl(objectPath);
        uploadedWorkshopImageUrl = data.publicUrl ?? null;
      }

      if (formSpeakerImageFile) {
        const objectPath = `speakers/${randomBase}-speaker-${formSpeakerImageFile.name.replace(/[^\w.-]+/g, "_")}`;
        const { error: uploadError } = await client.storage.from(SPEAKER_AVATAR_BUCKET).upload(objectPath, formSpeakerImageFile, {
          upsert: true,
          contentType: formSpeakerImageFile.type || undefined,
        });
        if (uploadError) {
          setFormError(`Profilbild konnte nicht hochgeladen werden: ${uploadError.message}`);
          return;
        }
        const { data } = client.storage.from(SPEAKER_AVATAR_BUCKET).getPublicUrl(objectPath);
        uploadedSpeakerImageUrl = data.publicUrl ?? null;
      }

      const payload = {
        title,
        speaker,
        room: formRoom,
        time_slot: formSlot,
        building: formBuilding,
        floor: formFloor,
        time_label: formTimeLabel,
        description: description ? description : null,
        image_url: uploadedWorkshopImageUrl,
        speaker_image_url: uploadedSpeakerImageUrl,
        chili_level: formChiliLevel,
      };

      const { error: saveError } = editingId
        ? await client.from("workshops").update(payload).eq("id", editingId)
        : await client.from("workshops").insert(payload);

      if (saveError) {
        setFormError(
          editingId
            ? `Workshop konnte nicht aktualisiert werden: ${saveError.message}`
            : `Workshop konnte nicht hinzugefügt werden: ${saveError.message}`
        );
        return;
      }

      setFormSuccess(editingId ? "Workshop aktualisiert." : "Neuer Workshop hinzugefügt.");
      await loadData();
      setCreateOpen(false);
      setEditingId(null);
      resetCreateForm();
    } finally {
      setFormSubmitting(false);
    }
  }

  function openEditWorkshop(workshop: WorkshopRow) {
    setFormError("");
    setFormSuccess("");

    const nextBuilding = (workshop.building ?? defaultBuilding) as Building;
    const nextFloor = workshop.floor ?? (floorsByBuilding[nextBuilding]?.[0] ?? 0);
    const nextRoom = workshop.room ?? (roomsByLocation[nextBuilding]?.[nextFloor]?.[0] ?? "");
    const nextSlot = workshop.time_slot ?? 1;
    const nextTimeLabel = workshop.time_label ?? slotLabel[nextSlot];

    setEditingId(workshop.id);
    setFormSlot(nextSlot);
    setFormTimeLabel(nextTimeLabel);
    setFormBuilding(nextBuilding);
    setFormFloor(nextFloor);
    setFormRoom(nextRoom);

    setFormTitle(workshop.title ?? "");
    setFormDescription(workshop.description ?? "");

    if (formImagePreview) URL.revokeObjectURL(formImagePreview);
    if (formSpeakerImagePreview) URL.revokeObjectURL(formSpeakerImagePreview);
    setFormImageFile(null);
    setFormImagePreview(null);
    setFormImageUrl(workshop.image_url ?? null);
    setFormSpeakerImageFile(null);
    setFormSpeakerImagePreview(null);
    setFormSpeakerImageUrl(workshop.speaker_image_url ?? null);

    setFormSpeaker(workshop.speaker ?? "");
    setFormChiliLevel((workshop.chili_level ?? 2) as ChiliLevel);

    setCreateOpen(true);
  }

  async function handleDeleteWorkshop(workshopId: string) {
    const confirmed = window.confirm("Workshop wirklich entfernen?");
    if (!confirmed) return;

    const client = getSupabaseClient();
    if (!client) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    setDeletingId(workshopId);
    setError("");
    try {
      const { error: delError } = await client.from("workshops").delete().eq("id", workshopId);
      if (delError) {
        setError(`Workshop konnte nicht entfernt werden: ${delError.message}`);
        return;
      }
      await loadData();
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!createOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCreateOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [createOpen]);

  // Realtime refresh (best-effort)
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel("admin-workshops-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;

    async function loadSettings() {
      setSettingsLoading(true);
      setSettingsError("");
      const res = await fetch("/api/admin/settings", { method: "GET" });
      if (!res.ok) {
        setSettingsError("Einstellungen konnten nicht geladen werden.");
        setSettingsLoading(false);
        return;
      }

      const json = (await res.json().catch(() => ({}))) as { registration_enabled?: boolean };
      setRegistrationEnabled(json.registration_enabled ?? true);
      setSettingsLoading(false);
    }

    loadSettings();
  }, [settingsOpen]);

  async function saveSettings(next: { registration_enabled?: boolean }) {
    setSettingsSaving(true);
    setSettingsError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setSettingsError(payload.error ?? "Einstellungen konnten nicht gespeichert werden.");
        return null;
      }

      const json = (await res.json().catch(() => ({}))) as { registration_enabled?: boolean };
      setRegistrationEnabled(json.registration_enabled ?? true);
      return {
        registration_enabled: json.registration_enabled ?? true,
      };
    } finally {
      setSettingsSaving(false);
    }
  }

  return (
    <div className="relative space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Workshops
          </h1>
          <p className="text-sm text-white/60">Filter nach Slot + Live-Auslastung</p>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/85 shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition hover:border-white/25 hover:bg-white/10 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            aria-label="Einstellungen"
            title="Einstellungen"
          >
            <Settings size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError("");
              setFormSuccess("");
              setEditingId(null);
              resetCreateForm();
              setCreateOpen(true);
            }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand p-0 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:brightness-110 active:scale-[0.99]"
            aria-label="Neuen Workshop hinzufügen"
            title="Neuen Workshop hinzufügen"
          >
              <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {settingsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1224]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Einstellungen"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSettingsOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-white">Einstellungen</h2>
                <p className="mt-1 text-sm text-white/60">App-weite Toggles</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/85 transition hover:border-white/25 hover:bg-white/10"
                aria-label="Schließen"
                title="Schließen"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {settingsError ? (
              <p
                className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100"
                role="alert"
              >
                {settingsError}
              </p>
            ) : null}

            <div className="mt-4 space-y-3">
              <SettingRow
                label="Anmeldung aktiv"
                description="Wenn aus: Besucher können keine Workshops wählen."
                value={registrationEnabled}
                disabled={settingsLoading || settingsSaving}
                onChange={async (v) => {
                  const prev = registrationEnabled;
                  setRegistrationEnabled(v);
                  const saved = await saveSettings({ registration_enabled: v });
                  if (!saved) {
                    setRegistrationEnabled(prev);
                  }
                }}
              />
            </div>

            {settingsLoading ? <p className="mt-4 text-sm text-white/55">Lade …</p> : null}
          </div>
        </div>
      ) : null}

      {detailOpen && detailWorkshop ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1224]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Workshop Details"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailOpen(false);
          }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md max-h-[calc(100dvh-2rem)] overflow-y-auto [-webkit-overflow-scrolling:touch] overscroll-contain"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                  Slot {detailWorkshop.time_slot} · {detailWorkshop.time_label ?? slotLabel[detailWorkshop.time_slot]}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">{detailWorkshop.title}</h2>
                <p className="mt-1 text-sm text-white/70">{detailWorkshop.speaker}</p>
                <p className="mt-1 text-sm text-white/55">{detailWorkshop.room}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/85 transition hover:border-white/25 hover:bg-white/10"
                aria-label="Schließen"
                title="Schließen"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {detailWorkshop.description ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                {detailWorkshop.description}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Ort</p>
                <p className="mt-2 text-sm text-white/80">
                  {detailWorkshop.building ? `${detailWorkshop.building} · ` : ""}
                  {detailWorkshop.floor == null
                    ? ""
                    : detailWorkshop.floor === -1
                      ? "Untergeschoss · "
                      : detailWorkshop.floor === 0
                        ? "Erdgeschoss · "
                        : `${detailWorkshop.floor}. Obergeschoss · `}
                  {detailWorkshop.room}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Teilnehmer</p>
                <p className="mt-2 text-3xl font-semibold text-white/80">
                  {counts.get(detailWorkshop.id) ?? participants.length}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white/85">Teilnehmerliste</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !addOpen;
                        setAddOpen(next);
                        if (next) {
                          setAddSearch("");
                          setAddSearchResults([]);
                          setAddSearchError("");
                          setAddSearchLoading(false);
                          setAddName("");
                          setAddTicketId("");
                        }
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/85 transition hover:border-white/25 hover:bg-white/10"
                      aria-label="Teilnehmer hinzufügen"
                      title="Teilnehmer hinzufügen"
                    >
                      <Plus size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openWorkshopDetail(detailWorkshop)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/85 transition hover:border-white/25 hover:bg-white/10"
                      aria-label="Refresh"
                      title="Refresh"
                    >
                      <RefreshCw size={16} aria-hidden="true" />
                    </button>
                  </div>
              </div>

              {addOpen ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white/85">Teilnehmer hinzufügen</h4>
                      <p className="mt-1 text-xs text-white/45">Suche nach Name oder Ticket ID.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddOpen(false)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/85 transition hover:border-white/25 hover:bg-white/10"
                      aria-label="Schließen"
                      title="Schließen"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45" htmlFor="add-search">
                      Suchen
                    </label>
                    <input
                      id="add-search"
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      placeholder="z.B. TESTUSER23 oder TICKET-123"
                      className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10"
                    />
                    {addSearchLoading ? <p className="mt-2 text-xs text-white/45">Suche …</p> : null}
                    {addSearchError ? (
                      <p className="mt-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100" role="alert">
                        {addSearchError}
                      </p>
                    ) : null}
                    {!addSearchLoading && addSearchResults.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {addSearchResults.map((t) => {
                          const label = (t.guest_name ?? "").trim() || t.ticket_id;
                          return (
                            <li key={t.ticket_id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddTicketId(t.ticket_id);
                                  setAddName((t.guest_name ?? "").trim());
                                }}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-white/20 hover:bg-white/10"
                              >
                                <span className="block text-sm font-medium text-white/80">{label}</span>
                                <span className="mt-0.5 block text-xs text-white/45">{t.ticket_id}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      disabled={!addTicketId.trim() || participantActionLoading != null}
                      onClick={async () => {
                        const t = addTicketId.trim();
                        const w = detailWorkshop.id;
                        if (!t || !w) return;
                        await setParticipantWorkshop(t, w, addName.trim());
                        setAddName("");
                        setAddTicketId("");
                        setAddOpen(false);
                      }}
                      className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                    >
                      Hinzufügen zu {detailWorkshop.title}
                    </button>
                    {addTicketId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAddName("");
                          setAddTicketId("");
                        }}
                        className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-white/25 hover:bg-white/10"
                      >
                        Auswahl entfernen
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {participantError ? (
                <p className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100" role="alert">
                  {participantError}
                </p>
              ) : null}

              {participantLoading ? <p className="mt-3 text-sm text-white/55">Lade Teilnehmer …</p> : null}

              {!participantLoading ? (
                participants.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {participants.map((p) => {
                      const name = p.tickets?.guest_name?.trim();
                      const ticketId = p.ticket_id ?? "";
                      const label = name && name.length > 0 ? name : ticketId || "—";
                      const moveOptions = workshops.filter(
                        (w) => w.time_slot === detailWorkshop.time_slot && w.id !== detailWorkshop.id
                      );
                      return (
                        <li
                          key={`${p.ticket_id ?? "x"}-${p.created_at ?? ""}`}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="block text-sm font-medium text-white/80">{label}</span>
                              <span className="mt-1 block text-xs text-white/45">
                                {p.created_at ? new Date(p.created_at).toLocaleString("de-CH") : "—"}
                              </span>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                              <button
                                type="button"
                                disabled={!ticketId || participantActionLoading != null}
                                onClick={() => removeParticipant(ticketId, detailWorkshop.id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-300/25 bg-rose-500/10 text-rose-100 transition hover:border-rose-300/40 hover:bg-rose-500/15 disabled:opacity-60"
                                aria-label="Teilnehmer entfernen"
                                title="Entfernen"
                              >
                                {participantActionLoading === `remove:${ticketId}` ? (
                                  <span className="text-sm">…</span>
                                ) : (
                                  <Trash2 size={16} aria-hidden="true" />
                                )}
                              </button>

                              {moveOptions.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    defaultValue=""
                                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none transition focus:border-white/30 focus:bg-white/10"
                                    onChange={async (e) => {
                                      const nextId = e.target.value;
                                      if (!nextId || !ticketId) return;
                                      e.currentTarget.value = "";
                                      await setParticipantWorkshop(ticketId, nextId);
                                    }}
                                    disabled={participantActionLoading != null || !ticketId}
                                    aria-label="Teilnehmer verschieben"
                                  >
                                    <option value="">Verschieben…</option>
                                    {moveOptions.map((w) => (
                                      <option key={w.id} value={w.id}>
                                        {w.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-white/55">Noch keine Teilnehmer.</p>
                )
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1224]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Neuer Workshop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreateOpen(false);
          }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md max-h-[calc(100dvh-2rem)] overflow-y-auto [-webkit-overflow-scrolling:touch] overscroll-contain"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  {editingId ? "Workshop bearbeiten" : "Neuer Workshop hinzufügen"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:border-white/25 hover:bg-white/10"
                aria-label="Schließen"
                title="Schließen"
              >
                Schließen
              </button>
            </div>

            <form onSubmit={handleCreateWorkshop} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Slot auswahl</label>
                  <select
                    value={formSlot}
                    onChange={(e) => setFormSlot(Number(e.target.value) as Slot)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-white/30 focus:bg-white/10"
                    aria-label="Slot auswahl"
                  >
                    <option value={1}>Slot 1</option>
                    <option value={2}>Slot 2</option>
                    <option value={3}>Slot 3</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Zeit auswahl</label>
                  <select
                    value={formTimeLabel}
                    onChange={(e) => {
                      const nextTime = e.target.value;
                      setFormTimeLabel(nextTime);
                      const nextSlot = nextTime === slotLabel[1] ? 1 : nextTime === slotLabel[2] ? 2 : 3;
                      setFormSlot(nextSlot as Slot);
                    }}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-white/30 focus:bg-white/10"
                    aria-label="Zeit auswahl"
                  >
                    <option value={slotLabel[1]}>{slotLabel[1]}</option>
                    <option value={slotLabel[2]}>{slotLabel[2]}</option>
                    <option value={slotLabel[3]}>{slotLabel[3]}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Gebäude auswählen</label>
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
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-white/30 focus:bg-white/10"
                    aria-label="Gebäude auswählen"
                  >
                    {buildingOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Stock auswählen</label>
                  <select
                    value={formFloor}
                    onChange={(e) => {
                      const nextFloor = Number(e.target.value);
                      setFormFloor(nextFloor);
                      const nextRoom = roomsByLocation[formBuilding]?.[nextFloor]?.[0] ?? "";
                      setFormRoom(nextRoom);
                    }}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-white/30 focus:bg-white/10"
                    aria-label="Stock auswählen"
                  >
                    {floorsByBuilding[formBuilding].map((f) => (
                      <option key={f} value={f}>
                        {f === -1 ? "Untergeschoss" : f === 0 ? "Erdgeschoss" : `${f}. Obergeschoss`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/80">Raum auswählen</label>
                <select
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-white/30 focus:bg-white/10"
                  aria-label="Raum auswählen"
                >
                  {(roomsByLocation[formBuilding]?.[formFloor] ?? []).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/80">Titel</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Titel hinzufügen"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none ring-0 transition focus:border-white/30 focus:bg-white/10"
                  maxLength={120}
                  aria-label="Titel hinzufügen"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/80">Beschreibung</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Beschreibung hinzufügen"
                  className="min-h-[90px] w-full resize-y rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none ring-0 transition focus:border-white/30 focus:bg-white/10"
                  maxLength={900}
                  aria-label="Beschreibung hinzufügen"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/80">Bild (Browse aus Downloads)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (formImagePreview) URL.revokeObjectURL(formImagePreview);
                    setFormImageFile(file);
                    setFormImagePreview(file ? URL.createObjectURL(file) : null);
                    setFormImageUrl(null);
                  }}
                  className="w-full cursor-pointer rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition file:mr-4 file:rounded-xl file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white file:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                  aria-label="Bild hinzufügen"
                />
                {formImagePreview || formImageUrl ? (
                  <div className="pt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formImagePreview ?? formImageUrl ?? ""}
                      alt="Vorschau"
                      className="h-24 w-24 rounded-xl border border-white/15 bg-white/5 object-cover"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex items-end gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-white">
                  {formSpeakerImagePreview || formSpeakerImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formSpeakerImagePreview ?? formSpeakerImageUrl ?? ""}
                      alt="Profilbild Vorschau"
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    speakerInitials || "?"
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="block text-sm font-medium text-white/80">Speaker (Profilbild)</label>
                  <input
                    value={formSpeaker}
                    onChange={(e) => setFormSpeaker(e.target.value)}
                    placeholder="Name"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none ring-0 transition focus:border-white/30 focus:bg-white/10"
                    maxLength={80}
                    aria-label="Speaker hinzufügen (Profilbild) Name"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (formSpeakerImagePreview) URL.revokeObjectURL(formSpeakerImagePreview);
                      setFormSpeakerImageFile(file);
                      setFormSpeakerImagePreview(file ? URL.createObjectURL(file) : null);
                      setFormSpeakerImageUrl(null);
                    }}
                    className="w-full cursor-pointer rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition file:mr-4 file:rounded-xl file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white file:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                    aria-label="Profilbild hinzufügen"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/80">Chili Bewertung</label>
                <select
                  value={formChiliLevel}
                  onChange={(e) => setFormChiliLevel(Number(e.target.value) as ChiliLevel)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-white/30 focus:bg-white/10"
                  aria-label="Chili Bewertung"
                >
                  <option value={1}>1 (mild)</option>
                  <option value={2}>2 (mittel)</option>
                  <option value={3}>3 (hot)</option>
                </select>
              </div>

              {formError ? (
                <p
                  className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100"
                  role="alert"
                >
                  {formError}
                </p>
              ) : null}
              {formSuccess ? (
                <p
                  className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100"
                  role="status"
                >
                  {formSuccess}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
              >
                {formSubmitting ? (editingId ? "Speichern …" : "Hinzufügen …") : editingId ? "Speichern" : "Hinzufügen"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <FilterChip active={slot === "all"} onClick={() => setSlot("all")}>
          Alle
        </FilterChip>
        {([1, 2, 3] as const).map((s) => (
          <FilterChip key={s} active={slot === s} onClick={() => setSlot(s)}>
            Slot {s}
          </FilterChip>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {loading ? <p className="text-sm text-white/60">Lade Workshops …</p> : null}

      {!loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {filtered.map(({ workshop, count }) => {
            const percent = Math.round((count / maxCount) * 100);
            return (
              <Card
                key={workshop.id}
                className="rounded-2xl border-white/15 bg-white/10 p-5 backdrop-blur-md hover:shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-shadow cursor-pointer"
                onClick={() => openWorkshopDetail(workshop)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                      Slot {workshop.time_slot}
                    </p>
                    <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-white">{workshop.title}</h2>
                    <p className="mt-1 text-sm text-white/70">{workshop.speaker}</p>
                    <p className="mt-1 text-sm text-white/55">
                      {slotLabel[workshop.time_slot]} · {workshop.room}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditWorkshop(workshop);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                        aria-label="Workshop bearbeiten"
                        title="Bearbeiten"
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteWorkshop(workshop.id);
                        }}
                        disabled={deletingId === workshop.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:border-white/25 hover:bg-white/10 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                        aria-label="Workshop entfernen"
                        title="Entfernen"
                      >
                        {deletingId === workshop.id ? <span className="text-sm">…</span> : <Trash2 size={16} aria-hidden="true" />}
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Teilnehmer</p>
                      <p className="mt-1 text-3xl font-semibold text-white/80">{count}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-2 rounded-full bg-brand transition-all",
                      slot === "all" ? "" : slot === 1 ? "bg-sky-400" : slot === 2 ? "bg-brand" : "bg-orange-400"
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const initials = parts
    .map((p) => (p.length > 0 ? p[0] : ""))
    .join("");
  return initials.toUpperCase();
}

 
function SettingRow({
  label,
  description,
  value,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void | Promise<void>;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white/90">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/60">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-60",
          value ? "border-emerald-300/30 bg-emerald-500/25" : "border-white/15 bg-white/10"
        )}
        title={label}
      >
        <span
          className={cn("inline-block h-5 w-5 rounded-full bg-white transition-transform", value ? "translate-x-6" : "translate-x-1")}
        />
      </button>
    </div>
  );
}

