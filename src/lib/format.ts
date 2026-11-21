// The hospital runs on East Africa Time (UTC+3, no daylight saving).
export const HOSPITAL_TIMEZONE = "Africa/Mogadishu";
const OFFSET = "+03:00";
const OFFSET_MS = 3 * 60 * 60 * 1000;

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? `${value}T00:00:00${OFFSET}` : value);
  return d.toLocaleDateString("en-GB", { timeZone: HOSPITAL_TIMEZONE, day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    timeZone: HOSPITAL_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMoney(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

/** ISO timestamp -> value for <input type="datetime-local"> in hospital time */
export function toDateTimeInput(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + OFFSET_MS).toISOString().slice(0, 16);
}

/** <input type="datetime-local"> value (hospital time) -> ISO timestamp */
export function fromDateTimeInput(value: string) {
  return new Date(`${value}:00${OFFSET}`).toISOString();
}

/** Today's date range in hospital time, as ISO timestamps */
export function todayRange() {
  const local = new Date(Date.now() + OFFSET_MS).toISOString().slice(0, 10);
  const start = new Date(`${local}T00:00:00${OFFSET}`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString(), date: local };
}

/** Current time in ms (kept out of components for the React purity lint) */
export function nowMs() {
  return Date.now();
}
