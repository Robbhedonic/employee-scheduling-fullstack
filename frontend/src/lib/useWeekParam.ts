import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { defaultSelectedDay, mondayOf, thisMonday } from '@/lib/dates';

const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Read/write the `?week=YYYY-MM-DD` query param so a refresh keeps the user on
 * the same week. Invalid or missing values fall back to this week.
 *
 * Also tracks the "selected day" for mobile day-stack views; resetting to
 * today (if in week) or Monday whenever the week changes.
 */
export function useWeekParam() {
  const [params, setParams] = useSearchParams();

  const weekOf = useMemo(() => {
    const raw = params.get('week');
    if (raw && WEEK_RE.test(raw)) {
      // Normalise: caller may have passed any date; snap to that week's Monday.
      return mondayOf(new Date(raw));
    }
    return thisMonday();
  }, [params]);

  const [selectedDate, setSelectedDate] = useState(() =>
    defaultSelectedDay(weekOf),
  );

  const setWeekOf = useCallback(
    (next: string) => {
      const today = thisMonday();
      const nextParams = new URLSearchParams(params);
      if (next === today) {
        nextParams.delete('week');
      } else {
        nextParams.set('week', next);
      }
      setParams(nextParams, { replace: true });
      setSelectedDate(defaultSelectedDay(next));
    },
    [params, setParams],
  );

  return { weekOf, setWeekOf, selectedDate, setSelectedDate };
}
