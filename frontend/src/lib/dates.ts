const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const WEEKDAYS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
] as const;

/** ISO date (YYYY-MM-DD) of the Monday of the week containing `date`. */
export function mondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

/** Today's Monday as YYYY-MM-DD. */
export function thisMonday(): string {
  return mondayOf(new Date());
}

/** Shift the Monday by `weeks` (negative = back). Returns YYYY-MM-DD. */
export function addWeeks(weekOf: string, weeks: number): string {
  const d = parseISODate(weekOf);
  d.setDate(d.getDate() + weeks * 7);
  return toISODate(d);
}

/** Returns the 7 dates of a week starting on `weekOf` (Monday). */
export function weekDates(weekOf: string): Date[] {
  const monday = parseISODate(weekOf);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Format a Monday as a compact range label, e.g. "Apr 13 - 19" or "Apr 28 - May 4". */
export function formatWeekRange(weekOf: string): string {
  const dates = weekDates(weekOf);
  const start = dates[0];
  const end = dates[6];
  const startMonth = MONTHS[start.getMonth()];
  const endMonth = MONTHS[end.getMonth()];
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse YYYY-MM-DD as a local-time Date (avoids the UTC drift that `new Date(s)` causes). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Pick the natural "selected day" for a given week:
 * today's date if today falls in the week, otherwise the Monday.
 * Used by mobile day-stack layouts.
 */
export function defaultSelectedDay(weekOf: string): string {
  const today = toISODate(new Date());
  const dates = weekDates(weekOf).map(toISODate);
  return dates.includes(today) ? today : dates[0];
}
