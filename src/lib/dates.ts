/** Uygulama tarihleri Türkiye saati (Vercel UTC ortamında da doğru çalışır) */
export const APP_TIMEZONE = "Europe/Istanbul";

/** Seçilen saat diliminde YYYY-MM-DD */
export function toLocalDateISO(
  d: Date = new Date(),
  timeZone = APP_TIMEZONE
): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone }).format(d);
}

function weekdaySinceMonday(iso: string, timeZone = APP_TIMEZONE): number {
  const ref = new Date(`${iso}T12:00:00+03:00`);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(ref);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dow = map[weekday] ?? 1;
  return dow === 0 ? 6 : dow - 1;
}

/** Bu haftanın Pazartesi günü (00:00 yerel) */
export function getWeekStartDate(d: Date = new Date()): Date {
  const iso = getWeekStartISO(d);
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

/** Bu haftanın Pazar günü (Pazartesi + 6 gün) */
export function getWeekEndDate(d: Date = new Date()): Date {
  const sunday = getWeekStartDate(d);
  sunday.setDate(sunday.getDate() + 6);
  return sunday;
}

export function getWeekStartISO(
  d: Date = new Date(),
  timeZone = APP_TIMEZONE
): string {
  const iso = toLocalDateISO(d, timeZone);
  return addDaysISO(iso, -weekdaySinceMonday(iso, timeZone));
}

/** YYYY-MM-DD tarihinin ait olduğu haftanın Pazartesi günü */
export function getWeekStartForISO(
  iso: string,
  timeZone = APP_TIMEZONE
): string {
  const normalized = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return getWeekStartISO();
  return addDaysISO(normalized, -weekdaySinceMonday(normalized, timeZone));
}

export function getWeekEndISO(d: Date = new Date()): string {
  return addDaysISO(getWeekStartISO(d), 6);
}

export function todayLocalISO(timeZone = APP_TIMEZONE): string {
  return toLocalDateISO(new Date(), timeZone);
}

/** YYYY-MM-DD → GG/AA/YYYY */
export function formatISODateAsTR(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

/** GG/AA/YYYY veya GG/AA/YY → YYYY-MM-DD; geçersizse null */
export function parseTRDateToISO(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (match[3].length === 2) year += year >= 70 ? 1900 : 2000;

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return toLocalDateISO(date);
}

/**
 * Sohbet mesajları için akıllı saat/tarih biçimi:
 * - Bugün: "14:32"
 * - Dün: "Dün 14:32"
 * - Bu yıl: "12 Oca 14:32"
 * - Diğer: "12 Oca 2024 14:32"
 */
/** Öğrenci son aktiflik etiketi: göreli süre + saat/tarih */
export function formatLastActive(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const when = formatChatTimestamp(date.toISOString());

  if (mins < 1) return `Az önce · ${when}`;
  if (mins < 60) return `${mins} dk önce · ${when}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce · ${when}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce · ${when}`;
  return when;
}

export function formatChatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const time = d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (msgDay.getTime() === today.getTime()) return time;
  if (msgDay.getTime() === yesterday.getTime()) return `Dün ${time}`;

  const dateFmt: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  if (d.getFullYear() !== now.getFullYear()) {
    dateFmt.year = "numeric";
  }
  return `${d.toLocaleDateString("tr-TR", dateFmt)} ${time}`;
}

export function formatTRDate(iso: string): string {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

/** "YYYY-MM-DD" hafta başlangıcı verildiğinde 6 gün sonrasının ISO'sunu döner */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toLocalDateISO(date);
}

/**
 * Hafta aralığını TR formatında biçimler.
 * Örn: "12 - 18 Oca 2025" veya "29 Oca - 4 Şub 2025"
 */
export function formatWeekRange(weekStartISO: string): string {
  const endISO = addDaysISO(weekStartISO, 6);
  const [sy, sm, sd] = weekStartISO.split("-").map(Number);
  const [ey, em, ed] = endISO.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  const monthFmt = new Intl.DateTimeFormat("tr-TR", { month: "short" });
  const startMonth = monthFmt.format(start);
  const endMonth = monthFmt.format(end);

  if (sy === ey && sm === em) {
    return `${sd} - ${ed} ${endMonth} ${ey}`;
  }
  if (sy === ey) {
    return `${sd} ${startMonth} - ${ed} ${endMonth} ${ey}`;
  }
  return `${sd} ${startMonth} ${sy} - ${ed} ${endMonth} ${ey}`;
}

function dateSortKey(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return 0;
  return y * 10000 + m * 100 + d;
}

/** YYYY-MM-DD tarihlerine göre azalan sıralama (bugüne en yakın önce) */
export function compareDateDesc(
  dateA: string,
  dateB: string,
  createdAtA?: string,
  createdAtB?: string
): number {
  const byDate = dateSortKey(dateB) - dateSortKey(dateA);
  if (byDate !== 0) return byDate;
  if (createdAtA && createdAtB) {
    return new Date(createdAtB).getTime() - new Date(createdAtA).getTime();
  }
  return 0;
}

export function sortByDateDesc<T>(
  items: T[],
  getDate: (item: T) => string,
  getCreatedAt?: (item: T) => string | undefined
): T[] {
  return [...items].sort((a, b) =>
    compareDateDesc(getDate(a), getDate(b), getCreatedAt?.(a), getCreatedAt?.(b))
  );
}

/** YYYY-MM-DD tarihlerine göre artan sıralama (en eski önce) */
export function sortByDateAsc<T>(
  items: T[],
  getDate: (item: T) => string,
  getCreatedAt?: (item: T) => string | undefined
): T[] {
  return [...items].sort((a, b) =>
    -compareDateDesc(getDate(a), getDate(b), getCreatedAt?.(a), getCreatedAt?.(b))
  );
}
