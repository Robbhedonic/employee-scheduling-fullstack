import { toISODate, weekDates } from '@/lib/dates';

const DAY_INITIAL = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  weekOf: string;
  selectedDate: string;
  onSelect: (date: string) => void;
};

/**
 * Compact 7-cell day picker for mobile. Each cell shows day initial and
 * day-of-month. The selected day is filled; others are quiet outlines.
 */
export function WeekStrip({ weekOf, selectedDate, onSelect }: Props) {
  const days = weekDates(weekOf);
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d, i) => {
        const date = toISODate(d);
        const active = date === selectedDate;
        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelect(date)}
            className={
              'flex flex-col items-center justify-center gap-0.5 rounded-lg border-[1.5px] py-2 text-[11px] font-medium transition-colors ' +
              (active
                ? 'border-ink bg-ink text-paper'
                : 'border-line-soft bg-paper text-ink-3 hover:border-ink hover:text-ink')
            }
            aria-pressed={active}
          >
            <span className="text-[10px] tracking-[0.08em] uppercase opacity-80">
              {DAY_INITIAL[i]}
            </span>
            <span className="font-display text-[18px] leading-none">
              {d.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
