import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { WeekNavigator } from '@/components/WeekNavigator';
import { Button } from '@/components/ui/button';
import { ApiError, apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  positionColors,
  SHIFT_LABEL,
  SHIFT_TIME,
  type ShiftType,
} from '@/lib/colors';
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

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string | null;
  avatar: string | null;
};

type ScheduleEntry = {
  id: string;
  date: string;
  shiftType: ShiftType;
  employee: { id: string; firstName: string; lastName: string };
};

export function JobSchedulePage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [weekOf, setWeekOf] = useState(thisMonday());
  const [picker, setPicker] = useState<{
    date: string;
    shiftType: ShiftType;
  } | null>(null);

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiFetch<{ employees: Employee[] }>('/employees', { token }),
  });

  const scheduleQuery = useQuery({
    queryKey: ['schedule', weekOf],
    queryFn: () =>
      apiFetch<{ schedule: ScheduleEntry[] }>(`/schedule?weekOf=${weekOf}`, {
        token,
      }),
  });

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    for (const e of employeesQuery.data?.employees ?? []) {
      map.set(e.id, e);
    }
    return map;
  }, [employeesQuery.data]);

  // Index entries by `${date}|${shiftType}`.
  const entriesByCell = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of scheduleQuery.data?.schedule ?? []) {
      const key = `${entry.date.slice(0, 10)}|${entry.shiftType}`;
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return map;
  }, [scheduleQuery.data]);

  const days = useMemo(() => weekDates(weekOf), [weekOf]);

  const assign = useMutation({
    mutationFn: (vars: {
      date: string;
      shiftType: ShiftType;
      employeeId: string;
    }) =>
      apiFetch('/schedule', {
        method: 'PUT',
        token,
        body: { entries: [vars] },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['schedule', weekOf] }),
  });

  const unassign = useMutation({
    mutationFn: (entryId: string) =>
      apiFetch(`/schedule/${entryId}`, { method: 'DELETE', token }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['schedule', weekOf] }),
  });

  return (
    <div className="space-y-7">
      <Hero weekOf={weekOf} onWeekChange={setWeekOf} />

      {scheduleQuery.isError ? (
        <ErrorBanner error={scheduleQuery.error} />
      ) : (
        <Grid
          days={days}
          entriesByCell={entriesByCell}
          employeeMap={employeeMap}
          loading={scheduleQuery.isLoading}
          onAdd={(date, shiftType) => setPicker({ date, shiftType })}
          onRemove={(entryId) => unassign.mutate(entryId)}
        />
      )}

      {picker && (
        <PickerDialog
          date={picker.date}
          shiftType={picker.shiftType}
          allEmployees={employeesQuery.data?.employees ?? []}
          alreadyAssigned={
            entriesByCell
              .get(`${picker.date}|${picker.shiftType}`)
              ?.map((e) => e.employee.id) ?? []
          }
          onClose={() => setPicker(null)}
          onPick={(employeeId) => {
            assign.mutate(
              { date: picker.date, shiftType: picker.shiftType, employeeId },
              { onSuccess: () => setPicker(null) },
            );
          }}
          isAssigning={assign.isPending}
        />
      )}
    </div>
  );
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
          Job schedule, <i className="text-terracotta">composed</i>.
        </h1>
      </div>
      <WeekNavigator weekOf={weekOf} onChange={onWeekChange} />
    </div>
  );
}

function Grid({
  days,
  entriesByCell,
  employeeMap,
  loading,
  onAdd,
  onRemove,
}: {
  days: Date[];
  entriesByCell: Map<string, ScheduleEntry[]>;
  employeeMap: Map<string, Employee>;
  loading: boolean;
  onAdd: (date: string, shiftType: ShiftType) => void;
  onRemove: (entryId: string) => void;
}) {
  const cols = '180px repeat(7, 1fr)';

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
            className="flex flex-col gap-0.5 border-l border-line-soft px-4 py-3.5"
          >
            <span className="text-[11px] font-semibold tracking-[0.1em] text-ink-3 uppercase">
              {DAY_LABELS[i]}
            </span>
            <span className="font-display text-[20px] leading-none">
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
            const cellKey = `${date}|${shift}`;
            const entries = entriesByCell.get(cellKey) ?? [];
            return (
              <div
                key={di}
                className="flex min-h-[140px] flex-col gap-1.5 border-l border-line-soft p-2.5"
              >
                {loading && entries.length === 0 ? (
                  <div className="h-6 animate-pulse rounded-md bg-bg-2" />
                ) : (
                  entries.map((entry) => {
                    const emp = employeeMap.get(entry.employee.id);
                    return (
                      <EmployeeChip
                        key={entry.id}
                        firstName={entry.employee.firstName}
                        lastName={entry.employee.lastName}
                        position={emp?.position}
                        onRemove={() => onRemove(entry.id)}
                      />
                    );
                  })
                )}
                <button
                  onClick={() => onAdd(date, shift)}
                  className="mt-auto inline-flex h-7 items-center justify-center gap-1 rounded-md text-[11px] text-ink-4 transition-colors hover:bg-bg-2 hover:text-ink"
                  aria-label={`Add to ${SHIFT_LABEL[shift]} on ${MONTHS[d.getMonth()]} ${d.getDate()}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function EmployeeChip({
  firstName,
  lastName,
  position,
  onRemove,
}: {
  firstName: string;
  lastName: string;
  position: string | null | undefined;
  onRemove: () => void;
}) {
  const c = positionColors(position);
  return (
    <div
      className="group flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-[11.5px] font-medium leading-tight"
      style={{ background: c.bg, color: c.fg, borderColor: c.border }}
    >
      <Avatar
        firstName={firstName}
        lastName={lastName}
        position={position}
        size={20}
      />
      <span className="min-w-0 flex-1 truncate">
        {firstName} {lastName[0]}.
      </span>
      <button
        onClick={onRemove}
        className="hidden h-4 w-4 shrink-0 items-center justify-center rounded-full bg-paper transition-colors group-hover:flex"
        style={{ borderColor: c.border, color: c.fg, border: '1px solid' }}
        title={`Remove ${firstName}`}
        aria-label={`Remove ${firstName}`}
      >
        <X size={10} />
      </button>
    </div>
  );
}

function PickerDialog({
  date,
  shiftType,
  allEmployees,
  alreadyAssigned,
  onClose,
  onPick,
  isAssigning,
}: {
  date: string;
  shiftType: ShiftType;
  allEmployees: Employee[];
  alreadyAssigned: string[];
  onClose: () => void;
  onPick: (employeeId: string) => void;
  isAssigning: boolean;
}) {
  const [query, setQuery] = useState('');
  const available = useMemo(() => {
    const taken = new Set(alreadyAssigned);
    const q = query.trim().toLowerCase();
    return allEmployees
      .filter((e) => !taken.has(e.id))
      .filter(
        (e) => !q || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q),
      );
  }, [allEmployees, alreadyAssigned, query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-[1.5px] border-line bg-paper shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-line-soft p-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
            Add to {SHIFT_LABEL[shiftType]} - {date}
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink">Pick someone</h2>
        </header>

        <div className="border-b border-line-soft p-3">
          <input
            type="search"
            autoFocus
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block h-10 w-full rounded-md border border-line-soft bg-bg px-3 text-sm focus:border-ink focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {available.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-3">
              {alreadyAssigned.length === allEmployees.length
                ? 'Everyone is already assigned to this shift.'
                : 'No employees match.'}
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {available.map((e) => (
                <li key={e.id}>
                  <button
                    disabled={isAssigning}
                    onClick={() => onPick(e.id)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-bg-2 disabled:opacity-50"
                  >
                    <Avatar
                      firstName={e.firstName}
                      lastName={e.lastName}
                      position={e.position}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {e.firstName} {e.lastName}
                      </div>
                      {e.position && (
                        <div className="truncate text-[11px] text-ink-3">
                          {e.position}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="flex justify-end border-t border-line-soft p-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </footer>
      </div>
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
        Could not load the schedule.
      </p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
    </div>
  );
}
