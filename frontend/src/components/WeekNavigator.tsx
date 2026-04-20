import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addWeeks, formatWeekRange, thisMonday } from '@/lib/dates';

type Props = {
  weekOf: string;
  onChange: (next: string) => void;
};

export function WeekNavigator({ weekOf, onChange }: Props) {
  const today = thisMonday();
  const isThisWeek = weekOf === today;
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(today)}
        disabled={isThisWeek}
        className="inline-flex h-9 items-center rounded-full px-3 text-xs font-medium text-ink-3 transition-colors hover:text-ink disabled:opacity-40"
      >
        Today
      </button>
      <div className="inline-flex items-center rounded-full border border-line-soft bg-paper">
        <button
          type="button"
          onClick={() => onChange(addWeeks(weekOf, -1))}
          className="grid h-9 w-9 place-items-center rounded-l-full text-ink transition-colors hover:bg-bg-2"
          aria-label="Previous week"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-3 font-mono text-[12px] font-medium tracking-tight text-ink">
          {formatWeekRange(weekOf)}
        </span>
        <button
          type="button"
          onClick={() => onChange(addWeeks(weekOf, 1))}
          className="grid h-9 w-9 place-items-center rounded-r-full text-ink transition-colors hover:bg-bg-2"
          aria-label="Next week"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
