export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Eingabe beim Tippen: UUID mit Bindestrichen oder alphanumerisch (z. B. 10-stellig). */
export function filterTicketInput(raw: string): string {
  const s = raw.trim().replace(/\s/g, "");
  if (s.includes("-")) {
    return s.replace(/[^0-9a-fA-F-]/g, "").slice(0, 36);
  }
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 64);
}

/** Vergleich mit DB: exakt wie in `tickets.ticket_id` gespeichert. */
export function normalizeTicketId(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return "";
  }
  if (trimmed.includes("-")) {
    const cleaned = trimmed.replace(/[^0-9a-fA-F-]/g, "");
    return cleaned.toUpperCase();
  }
  return trimmed.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidTicketId(value: string): boolean {
  if (!value) {
    return false;
  }
  if (value.includes("-")) {
    return /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(value);
  }
  return /^[A-Z0-9]{4,64}$/.test(value);
}
