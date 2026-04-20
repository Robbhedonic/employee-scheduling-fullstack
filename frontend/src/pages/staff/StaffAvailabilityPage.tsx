import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Check, X } from 'lucide-react';
import { WeekNavigator } from '@/components/WeekNavigator';
import { WeekStrip } from '@/components/WeekStrip';
import { Button } from '@/components/ui/button';
import { ApiError, apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SHIFT_LABEL, SHIFT_TIME, type ShiftType } from '@/lib/colors';
import {
  defaultSelectedDay,
  parseISODate,
  thisMonday,
  toISODate,
  weekDates,
} from '@/lib/dates';

const SHIFTS: ShiftType[] = ['MORNING', 'AFTERNOON', 'NIGHT'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

const SHIFT_HUE: Record<ShiftType, number> = {
  MORNING: 230,
  AFTERNOON: 190,
  NIGHT: 285,
};

type AvailabilityEntry = {
  id: string;
  employeeId: string;
  date: string;
  shiftType: ShiftType;
  isAvailable: boolean;
};

type DayChoice =
  | 'available'
  | 'unavailable'
  | 'prefer:MORNING'
  | 'prefer:AFTERNOON'
  | 'prefer:NIGHT';

export function StaffAvailabilityPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const employeeId = user?.employeeId;
  const [weekOf, setWeekOfRaw] = useState(thisMonday());
  const [selectedDate, setSelectedDate] = useState(() =>
    defaultSelectedDay(thisMonday()),
  );
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const setWeekOf = (next: string) => {
    setWeekOfRaw(next);
    setSelectedDate(defaultSelectedDay(next));
  };

  const availabilityQuery = useQuery({
    queryKey: ['my-availability', employeeId, weekOf],
    queryFn: () =>
      apiFetch<{ availability: AvailabilityEntry[] }>(
        `/availability/${employeeId}?weekOf=${weekOf}`,
        { token },
      ),
    enabled: Boolean(employeeId),
  });

  // (date|shift) -> isAvailable
  const byCell = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const a of availabilityQuery.data?.availability ?? []) {
      map.set(`${a.date.slice(0, 10)}|${a.shiftType}`, a.isAvailable);
    }
    return map;
  }, [availabilityQuery.data]);

  const days = useMemo(() => weekDates(weekOf), [weekOf]);

  const saveDay = useMutation({
    mutationFn: (vars: { date: string; choice: DayChoice }) => {
      const entries = SHIFTS.map((shiftType) => ({
        date: vars.date,
        shiftType,
        isAvailable: isShiftAvailableForChoice(vars.choice, shiftType),
      }));
      return apiFetch(`/availability/${employeeId}`, {
        method: 'PUT',
        token,
        body: { entries },
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['my-availability', employeeId, weekOf],
      }),
  });

  if (!employeeId) {
    return (
      <p className="text-ink-3">
        Could not resolve your employee profile. Try logging out and back in.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Hero weekOf={weekOf} onWeekChange={setWeekOf} />

      {availabilityQuery.isError ? (
        <ErrorBanner error={availabilityQuery.error} />
      ) : (
        <>
          <div className="md:hidden">
            <WeekStrip
              weekOf={weekOf}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
            <MobileDay
              date={selectedDate}
              byCell={byCell}
              loading={availabilityQuery.isLoading}
              onEdit={(date) => setEditingDate(date)}
            />
          </div>
          <div className="hidden md:block">
            <Grid
              days={days}
              byCell={byCell}
              loading={availabilityQuery.isLoading}
              onEdit={(date) => setEditingDate(date)}
            />
          </div>
        </>
      )}

      {editingDate && (
        <ChooseDayModal
          date={editingDate}
          current={readDayChoice(editingDate, byCell)}
          isPending={saveDay.isPending}
          error={saveDay.error}
          onClose={() => {
            setEditingDate(null);
            saveDay.reset();
          }}
          onSave={(choice) =>
            saveDay.mutate(
              { date: editingDate, choice },
              {
                onSuccess: () => {
                  setEditingDate(null);
                  saveDay.reset();
                },
              },
            )
          }
        />
      )}
    </div>
  );
}

function isShiftAvailableForChoice(
  choice: DayChoice,
  shift: ShiftType,
): boolean {
  if (choice === 'available') return true;
  if (choice === 'unavailable') return false;
  return choice === `prefer:${shift}`;
}

function readDayChoice(
  date: string,
  byCell: Map<string, boolean>,
): DayChoice | null {
  const flags = SHIFTS.map((s) => byCell.get(`${date}|${s}`));
  if (flags.every((f) => f === undefined)) return null;
  if (flags.every((f) => f === true)) return 'available';
  if (flags.every((f) => f === false)) return 'unavailable';
  // Exactly one true, others false (or undefined treated as false here for inference).
  const trueCount = flags.filter((f) => f === true).length;
  if (trueCount === 1) {
    const idx = flags.findIndex((f) => f === true);
    return `prefer:${SHIFTS[idx]}` as DayChoice;
  }
  return null;
}

function Hero({
  weekOf,
  onWeekChange,
}: {
  weekOf: string;
  onWeekChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-6">
      <div className="min-w-0 md:flex-[1_1_420px]">
        <p className="mb-2 text-[11.5px] font-semibold tracking-[0.12em] text-ink-3 uppercase sm:text-[12px]">
          Week of {weekOf}
        </p>
        <h1 className="font-display text-[34px] leading-[1.08] text-ink sm:text-[40px] md:text-[48px]">
          My weekly <i className="text-terracotta">availability</i>
        </h1>
      </div>
      <WeekNavigator weekOf={weekOf} onChange={onWeekChange} />
    </div>
  );
}

function MobileDay({
  date,
  byCell,
  loading,
  onEdit,
}: {
  date: string;
  byCell: Map<string, boolean>;
  loading: boolean;
  onEdit: (date: string) => void;
}) {
  const d = parseISODate(date);
  const dayLabel = DAY_LABELS[(d.getDay() + 6) % 7];
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border-[1.5px] border-line-soft bg-paper">
      <div className="flex items-baseline justify-between border-b-[1.5px] border-line-soft bg-bg-2 px-4 py-3">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-ink-3 uppercase">
          {dayLabel}
        </span>
        <span className="font-display text-[18px] leading-none">
          {MONTHS[d.getMonth()]} {d.getDate()}
        </span>
      </div>
      <div className="divide-y divide-line-soft">
        {SHIFTS.map((shift) => {
          const flag = byCell.get(`${date}|${shift}`);
          return (
            <div key={shift} className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-[88px]">
                <div className="font-display text-[18px] leading-none">
                  {SHIFT_LABEL[shift]}
                </div>
                <div className="mt-1 font-mono text-[11px] text-ink-3">
                  {SHIFT_TIME[shift]}
                </div>
              </div>
              <div className="flex-1">
                {loading ? (
                  <div className="h-11 w-full animate-pulse rounded-md bg-bg-2" />
                ) : (
                  <ShiftCell flag={flag} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t-[1.5px] border-line-soft bg-bg-2 p-3">
        <button
          type="button"
          onClick={() => onEdit(date)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-line-soft bg-paper text-[13px] font-medium text-ink-2 transition-colors hover:border-ink hover:text-ink"
        >
          <Calendar size={14} className="opacity-60" />
          Edit this day
        </button>
      </div>
    </div>
  );
}

function Grid({
  days,
  byCell,
  loading,
  onEdit,
}: {
  days: Date[];
  byCell: Map<string, boolean>;
  loading: boolean;
  onEdit: (date: string) => void;
}) {
  const cols = '180px repeat(7, minmax(0, 1fr))';

  return (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-line-soft bg-paper">
      {/* Day headers */}
      <div
        className="grid border-b-[1.5px] border-line-soft bg-bg-2"
        style={{ gridTemplateColumns: cols }}
      >
        <div className="px-5 py-3.5 text-[11px] font-semibold tracking-[0.1em] text-ink-3 uppercase">
          Shift
        </div>
        {days.map((d, i) => (
          <div
            key={i}
            className="flex flex-col gap-0.5 border-l border-line-soft px-3 py-3.5"
          >
            <span className="text-[11px] font-semibold tracking-[0.1em] text-ink-3 uppercase">
              {DAY_LABELS[i]}
            </span>
            <span className="font-display text-[18px] leading-tight">
              {MONTHS[d.getMonth()]} {d.getDate()}
            </span>
          </div>
        ))}
      </div>

      {/* Shift rows */}
      {SHIFTS.map((shift, si) => (
        <div
          key={shift}
          className={`grid ${si < SHIFTS.length - 1 ? 'border-b-[1.5px] border-line-soft' : ''}`}
          style={{ gridTemplateColumns: cols }}
        >
          <div className="flex flex-col gap-1 border-r-[1.5px] border-line-soft bg-paper p-5">
            <span className="font-display text-[22px] leading-none">
              {SHIFT_LABEL[shift]}
            </span>
            <span className="font-mono text-[11px] text-ink-3">
              {SHIFT_TIME[shift]}
            </span>
          </div>
          {days.map((d, di) => {
            const date = toISODate(d);
            const flag = byCell.get(`${date}|${shift}`);
            return (
              <div
                key={di}
                className="flex min-h-[76px] items-center justify-center border-l border-line-soft p-2"
              >
                {loading ? (
                  <div className="h-11 w-full animate-pulse rounded-md bg-bg-2" />
                ) : (
                  <ShiftCell flag={flag} />
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Edit-day row */}
      <div
        className="grid border-t-[1.5px] border-line-soft bg-bg-2"
        style={{ gridTemplateColumns: cols }}
      >
        <div className="flex items-center px-5 py-3.5 text-[11px] font-semibold tracking-[0.1em] text-ink-3 uppercase">
          Edit day
        </div>
        {days.map((d, di) => {
          const date = toISODate(d);
          return (
            <div
              key={di}
              className="flex items-center justify-center border-l border-line-soft p-2.5"
            >
              <button
                type="button"
                onClick={() => onEdit(date)}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border-[1.5px] border-line-soft bg-paper text-[12px] font-medium text-ink-2 transition-colors hover:border-ink hover:text-ink"
              >
                <Calendar size={13} className="opacity-60" />
                Choose
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShiftCell({ flag }: { flag: boolean | undefined }) {
  if (flag === undefined) {
    return (
      <div
        className="flex h-11 w-full items-center justify-center rounded-md text-[13px] text-ink-4"
        style={{ border: '1.5px dashed var(--line-soft)' }}
      >
        -
      </div>
    );
  }
  if (flag) {
    return (
      <div
        className="flex h-11 w-full items-center justify-center rounded-md text-[12.5px] font-semibold"
        style={{
          background: 'oklch(0.92 0.09 145)',
          border: '1.5px solid oklch(0.55 0.16 145)',
          color: 'oklch(0.28 0.14 145)',
        }}
      >
        Available
      </div>
    );
  }
  return (
    <div
      className="flex h-11 w-full items-center justify-center rounded-md text-[12.5px] font-medium"
      style={{
        background: 'var(--bg-2)',
        border: '1.5px dashed var(--line-soft)',
        color: 'var(--ink-4)',
      }}
    >
      Unavailable
    </div>
  );
}

function ChooseDayModal({
  date,
  current,
  isPending,
  error,
  onClose,
  onSave,
}: {
  date: string;
  current: DayChoice | null;
  isPending: boolean;
  error: unknown;
  onClose: () => void;
  onSave: (choice: DayChoice) => void;
}) {
  const [choice, setChoice] = useState<DayChoice>(current ?? 'available');
  const d = parseISODate(date);
  const dayLabel = DAY_LABELS[(d.getDay() + 6) % 7];
  const dayOfMonth = d.getDate();
  const month = MONTHS[d.getMonth()];

  const errorMessage = error
    ? error instanceof ApiError
      ? error.message
      : (error as Error).message
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[min(480px,calc(100vw-48px))] flex-col overflow-hidden rounded-2xl border-[1.5px] border-line-soft bg-paper shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b-[1.5px] border-line-soft px-6 py-5">
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
              {dayLabel} · {month} {dayOfMonth}
            </p>
            <h2 className="font-display text-[26px] leading-none text-ink">
              Set <i className="text-terracotta">availability</i>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-bg-2 hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-2.5">
            <DayOption
              active={choice === 'available'}
              onClick={() => setChoice('available')}
              hue={145}
              title="Available all day"
              subtitle="Any shift works"
            />
            <DayOption
              active={choice === 'unavailable'}
              onClick={() => setChoice('unavailable')}
              neutral
              title="Unavailable"
              subtitle="Can't work this day"
            />
          </div>

          <div className="mt-5">
            <p className="mb-2.5 text-[12px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
              Or I prefer...
            </p>
            <div className="flex flex-col gap-2">
              {SHIFTS.map((s) => {
                const active = choice === `prefer:${s}`;
                const hue = SHIFT_HUE[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setChoice(`prefer:${s}` as DayChoice)}
                    className="grid w-full grid-cols-[1fr_auto] items-center rounded-lg border-[1.5px] px-4 py-3 text-left transition-colors"
                    style={{
                      background: active
                        ? `oklch(0.93 0.06 ${hue})`
                        : 'var(--paper)',
                      borderColor: active
                        ? `oklch(0.58 0.12 ${hue})`
                        : 'var(--line-soft)',
                      color: active ? `oklch(0.3 0.11 ${hue})` : 'var(--ink)',
                    }}
                  >
                    <span className="text-sm font-medium">
                      {SHIFT_LABEL[s]} shift
                    </span>
                    <span className="font-mono text-[12px] opacity-80">
                      {SHIFT_TIME[s]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t-[1.5px] border-line-soft px-6 py-3.5">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => onSave(choice)} disabled={isPending}>
            <Check size={14} />
            {isPending ? 'Saving...' : 'Confirm'}
          </Button>
        </footer>
      </div>
    </div>
  );
}

function DayOption({
  active,
  onClick,
  hue,
  neutral,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  hue?: number;
  neutral?: boolean;
  title: string;
  subtitle: string;
}) {
  let bg = 'var(--paper)';
  let border = 'var(--line-soft)';
  let fg = 'var(--ink)';
  if (active && neutral) {
    bg = 'var(--bg-3)';
    border = 'var(--ink-3)';
  } else if (active && hue !== undefined) {
    bg = `oklch(0.92 0.09 ${hue})`;
    border = `oklch(0.55 0.16 ${hue})`;
    fg = `oklch(0.28 0.14 ${hue})`;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-0.5 rounded-lg border-[1.5px] p-3.5 text-left transition-colors"
      style={{ background: bg, borderColor: border, color: fg }}
    >
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-[11.5px] opacity-75">{subtitle}</span>
    </button>
  );
}

function ErrorBanner({ error }: { error: unknown }) {
  const message =
    error instanceof ApiError
      ? `${error.status} - ${error.message}`
      : (error as Error).message;
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <p className="font-display text-lg text-red-800">
        Could not load your availability.
      </p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
    </div>
  );
}
