export type DmTrendDay = {
  date: string;
  label: string;
  sent: number;
};

const DAY_MS = 86_400_000;

type TrendGranularity = "day" | "week" | "month";

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Monday-start week bucket key. */
function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  return copy;
}

function startOfMonth(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(1);
  return copy;
}

function trendGranularity(dayCount: number | null): TrendGranularity {
  if (dayCount == null) return "month";
  if (dayCount <= 90) return "day";
  if (dayCount <= 365) return "week";
  return "month";
}

function dayLabel(d: Date, dayCount: number): string {
  if (dayCount <= 7) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Last N calendar days (including today), local timezone. */
export function emptyDmTrendDays(dayCount = 7): DmTrendDay[] {
  const days: DmTrendDay[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setTime(d.getTime() - i * DAY_MS);
    days.push({
      date: localDateKey(d),
      label: dayLabel(d, dayCount),
      sent: 0,
    });
  }
  return days;
}

function emptyWeeklyTrendBuckets(weekCount: number): DmTrendDay[] {
  const buckets: DmTrendDay[] = [];
  const anchor = startOfWeek(new Date());
  for (let i = weekCount - 1; i >= 0; i--) {
    const w = new Date(anchor);
    w.setDate(w.getDate() - i * 7);
    buckets.push({
      date: localDateKey(w),
      label: w.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      sent: 0,
    });
  }
  return buckets;
}

function emptyMonthlyTrendBuckets(monthCount: number): DmTrendDay[] {
  const buckets: DmTrendDay[] = [];
  const anchor = startOfMonth(new Date());
  for (let i = monthCount - 1; i >= 0; i--) {
    const m = new Date(anchor);
    m.setMonth(m.getMonth() - i);
    buckets.push({
      date: monthKey(m),
      label: m.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      sent: 0,
    });
  }
  return buckets;
}

function emptyMonthlyTrendFromRange(min: Date, max: Date): DmTrendDay[] {
  const start = startOfMonth(min);
  const end = startOfMonth(max);
  const buckets: DmTrendDay[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    buckets.push({
      date: monthKey(cursor),
      label: cursor.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      sent: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

export function buildDmTrendFromTimestamps(
  timestamps: string[],
  dayCount: number | null = 7,
): DmTrendDay[] {
  const granularity = trendGranularity(dayCount);

  if (granularity === "day") {
    const count = dayCount ?? 7;
    const buckets = emptyDmTrendDays(count);
    const indexByDate = new Map(buckets.map((b, i) => [b.date, i]));
    for (const iso of timestamps) {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) continue;
      const idx = indexByDate.get(localDateKey(d));
      if (idx != null) buckets[idx].sent += 1;
    }
    return buckets;
  }

  if (granularity === "week") {
    const weekCount = Math.ceil((dayCount ?? 365) / 7);
    const buckets = emptyWeeklyTrendBuckets(weekCount);
    const indexByDate = new Map(buckets.map((b, i) => [b.date, i]));
    for (const iso of timestamps) {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) continue;
      const idx = indexByDate.get(localDateKey(startOfWeek(d)));
      if (idx != null) buckets[idx].sent += 1;
    }
    return buckets;
  }

  const buckets =
    dayCount == null
      ? (() => {
          if (timestamps.length === 0) return emptyMonthlyTrendBuckets(1);
          let min = new Date(timestamps[0]!);
          let max = new Date(timestamps[0]!);
          for (const iso of timestamps) {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) continue;
            if (d < min) min = d;
            if (d > max) max = d;
          }
          return emptyMonthlyTrendFromRange(min, max);
        })()
      : emptyMonthlyTrendBuckets(12);

  const indexByDate = new Map(buckets.map((b, i) => [b.date, i]));
  for (const iso of timestamps) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const idx = indexByDate.get(monthKey(d));
    if (idx != null) buckets[idx].sent += 1;
  }
  return buckets;
}

export function periodStartIso(dayCount: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (dayCount - 1));
  return d.toISOString();
}

export function sevenDaysAgoIso(): string {
  return periodStartIso(7);
}

export function thirtyDaysAgoIso(): string {
  return periodStartIso(30);
}

export function todayStartIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Suggested X-axis label skip for recharts based on bucket count. */
export function trendAxisInterval(bucketCount: number): number {
  if (bucketCount <= 8) return 0;
  if (bucketCount <= 31) return Math.floor(bucketCount / 7);
  if (bucketCount <= 52) return Math.floor(bucketCount / 6);
  return Math.floor(bucketCount / 8);
}
