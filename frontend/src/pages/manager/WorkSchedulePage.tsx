import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@/components/Avatar';
import { WeekNavigator } from '@/components/WeekNavigator';
import { ApiError, apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { type ShiftType } from '@/lib/colors';
import { thisMonday, toISODate, weekDates } from '@/lib/dates';

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

const SHIFT_META: Record<
  ShiftType,
  { label: string; range: string; hue: number }
> = {
  MORNING: { label: 'Morning', range: '07-15', hue: 230 },
  AFTERNOON: { label: 'Afternoon', range: '15-22', hue: 190 },
  NIGHT: { label: 'Night', range: '22-02', hue: 285 },
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
};

type AvailabilityEntry = {
  id: string;
  employeeId: string;
  date: string;
  shiftType: ShiftType;
  isAvailable: boolean;
};

type CellStatus =
  | { kind: 'available' }
  | { kind: 'unavailable' }
  | { kind: 'prefer'; shift: ShiftType }
  | { kind: 'none' };

export function WorkSchedulePage() {
  const { token } = useAuth();
  const [weekOf, setWeekOf] = useState(thisMonday());

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiFetch<{ employees: Employee[] }>('/employees', { token }),
  });

  const availabilityQuery = useQuery({
    queryKey: ['availability', weekOf],
    queryFn: () =>
      apiFetch<{ availability: AvailabilityEntry[] }>(
        `/availability?weekOf=${weekOf}`,
        { token },
      ),
  });

  const days = useMemo(() => weekDates(weekOf), [weekOf]);
  const employees = employeesQuery.data?.employees ?? [];

  // (employeeId|date) -> status
  const statusByCell = useMemo(() => {
    type Bucket = { available: Set<ShiftType>; unavailable: Set<ShiftType> };
    const buckets = new Map<string, Bucket>();
    for (const a of availabilityQuery.data?.availability ?? []) {
      const key = `${a.employeeId}|${a.date.slice(0, 10)}`;
      const b = buckets.get(key) ?? {
        available: new Set<ShiftType>(),
        unavailable: new Set<ShiftType>(),
      };
      (a.isAvailable ? b.available : b.unavailable).add(a.shiftType);
      buckets.set(key, b);
    }

    const result = new Map<string, CellStatus>();
    for (const [key, b] of buckets) {
      result.set(key, classify(b.available, b.unavailable));
    }
    return result;
  }, [availabilityQuery.data]);

  const isLoading = employeesQuery.isLoading || availabilityQuery.isLoading;
  const error = employeesQuery.error ?? availabilityQuery.error;

  return (
    <div className="space-y-6">
      <Hero weekOf={weekOf} onWeekChange={setWeekOf} />

      <Legend />

      {error ? (
        <ErrorBanner error={error} />
      ) : (
        <Grid
          days={days}
          employees={employees}
          statusByCell={statusByCell}
          loading={isLoading}
        />
      )}
    </div>
  );
}

function classify(
  available: Set<ShiftType>,
  unavailable: Set<ShiftType>,
): CellStatus {
  if (available.size === SHIFTS.length) return { kind: 'available' };
  if (available.size === 0) {
    return unavailable.size > 0 ? { kind: 'unavailable' } : { kind: 'none' };
  }
  // 1 or 2 shifts available - pick the first by canonical order.
  const shift = SHIFTS.find((s) => available.has(s)) ?? 'MORNING';
  return { kind: 'prefer', shift };
}

function Hero({
  weekOf,
  onWeekChange,
}: {
  weekOf: string;
  onWeekChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0 flex-[1_1_420px]">
        <p className="mb-2 text-[12px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
          Week of {weekOf}
        </p>
        <h1 className="font-display text-[48px] leading-[1.08] text-ink">
          Who's on <i className="text-terracotta">when</i>.
        </h1>
      </div>
      <WeekNavigator weekOf={weekOf} onChange={onWeekChange} />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-ink-3">
      <LegendGroup title="Available">
        <Swatch kind="available" label="Available" />
      </LegendGroup>
      <LegendGroup title="Prefers">
        <Swatch kind="prefer" shift="MORNING" label="Morning" />
        <Swatch kind="prefer" shift="AFTERNOON" label="Afternoon" />
        <Swatch kind="prefer" shift="NIGHT" label="Night" />
      </LegendGroup>
      <LegendGroup title="Out">
        <Swatch kind="unavailable" label="Unavailable" />
      </LegendGroup>
    </div>
  );
}

function LegendGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-4 uppercase">
        {title}
      </span>
      <div className="inline-flex items-center gap-2.5">{children}</div>
    </div>
  );
}

function Swatch({
  kind,
  shift,
  label,
}: {
  kind: 'available' | 'unavailable' | 'prefer';
  shift?: ShiftType;
  label: string;
}) {
  let bg = '';
  let border = '';
  let dashed = false;
  if (kind === 'available') {
    bg = 'oklch(0.92 0.09 145)';
    border = 'oklch(0.55 0.16 145)';
  } else if (kind === 'unavailable') {
    bg = 'var(--bg-2)';
    border = 'var(--line-soft)';
    dashed = true;
  } else if (kind === 'prefer' && shift) {
    const hue = SHIFT_META[shift].hue;
    bg = `oklch(0.93 0.06 ${hue})`;
    border = `oklch(0.58 0.12 ${hue})`;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-4.5 rounded"
        style={{
          width: 18,
          background: bg,
          border: `1.5px ${dashed ? 'dashed' : 'solid'} ${border}`,
        }}
      />
      {label}
    </span>
  );
}

function Grid({
  days,
  employees,
  statusByCell,
  loading,
}: {
  days: Date[];
  employees: Employee[];
  statusByCell: Map<string, CellStatus>;
  loading: boolean;
}) {
  const cols = '220px repeat(7, minmax(0, 1fr))';

  if (!loading && employees.length === 0) {
    return (
      <div className="rounded-2xl border-[1.5px] border-dashed border-line-soft p-12 text-center">
        <p className="font-display text-2xl text-ink">No team members yet.</p>
        <p className="mt-2 text-sm text-ink-3">
          Register employees first, then their availability will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-line-soft bg-paper">
      <div
        className="grid border-b-[1.5px] border-line-soft bg-bg-2"
        style={{ gridTemplateColumns: cols }}
      >
        <div className="px-5 py-3.5 text-[11px] font-semibold tracking-[0.1em] text-ink-3 uppercase">
          Employee
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

      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} first={i === 0} />
          ))
        : employees.map((emp, ri) => (
            <Row
              key={emp.id}
              cols={cols}
              employee={emp}
              days={days}
              statusByCell={statusByCell}
              first={ri === 0}
            />
          ))}
    </div>
  );
}

function Row({
  cols,
  employee,
  days,
  statusByCell,
  first,
}: {
  cols: string;
  employee: Employee;
  days: Date[];
  statusByCell: Map<string, CellStatus>;
  first: boolean;
}) {
  return (
    <div
      className={`grid min-h-[76px] ${first ? '' : 'border-t border-line-soft'}`}
      style={{ gridTemplateColumns: cols }}
    >
      <div className="flex items-center gap-3 border-r-[1.5px] border-line-soft bg-paper px-5 py-3.5">
        <Avatar
          firstName={employee.firstName}
          lastName={employee.lastName}
          position={employee.position}
          size={36}
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink">
            {employee.firstName} {employee.lastName}
          </div>
          {employee.position && (
            <div className="mt-0.5 truncate text-[11px] text-ink-3">
              {employee.position}
            </div>
          )}
        </div>
      </div>

      {days.map((d, di) => {
        const key = `${employee.id}|${toISODate(d)}`;
        const status = statusByCell.get(key) ?? { kind: 'none' };
        return (
          <div
            key={di}
            className="flex items-center justify-center border-l border-line-soft p-2"
          >
            <StatusCell status={status} />
          </div>
        );
      })}
    </div>
  );
}

function StatusCell({ status }: { status: CellStatus }) {
  if (status.kind === 'none') {
    return <div className="h-11 w-full" aria-hidden />;
  }

  if (status.kind === 'available') {
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

  if (status.kind === 'unavailable') {
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

  const m = SHIFT_META[status.shift];
  return (
    <div
      className="flex h-11 w-full flex-col items-center justify-center rounded-md px-1.5 leading-tight"
      style={{
        background: `oklch(0.93 0.06 ${m.hue})`,
        border: `1.5px solid oklch(0.58 0.12 ${m.hue})`,
        color: `oklch(0.32 0.11 ${m.hue})`,
      }}
    >
      <span className="text-[11px] font-semibold tracking-[0.02em]">
        Prefers {m.label.toLowerCase()}
      </span>
      <span className="mt-0.5 font-mono text-[10.5px] opacity-85">
        {m.range}
      </span>
    </div>
  );
}

function SkeletonRow({ cols, first }: { cols: string; first: boolean }) {
  return (
    <div
      className={`grid min-h-[76px] ${first ? '' : 'border-t border-line-soft'}`}
      style={{ gridTemplateColumns: cols }}
    >
      <div className="flex items-center gap-3 border-r-[1.5px] border-line-soft bg-paper px-5 py-3.5">
        <div className="h-9 w-9 animate-pulse rounded-full bg-bg-2" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-bg-2" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-bg-2" />
        </div>
      </div>
      {Array.from({ length: 7 }).map((_, di) => (
        <div
          key={di}
          className="flex items-center justify-center border-l border-line-soft p-2"
        >
          <div className="h-11 w-full animate-pulse rounded-md bg-bg-2" />
        </div>
      ))}
    </div>
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
        Could not load the work schedule.
      </p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
    </div>
  );
}
