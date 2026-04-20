import {
  SHIFT_COLORS,
  SHIFT_LABEL,
  SHIFT_TIME,
  type ShiftType,
} from '@/lib/colors';

type Props = {
  shiftType: ShiftType;
  showTime?: boolean;
  children?: React.ReactNode;
};

/**
 * Pill colored by shift type. Default content is "Morning - 07:00 - 15:00".
 * Pass children to use it as a wrapper (e.g. for an assigned employee chip).
 */
export function ShiftChip({ shiftType, showTime = true, children }: Props) {
  const c = SHIFT_COLORS[shiftType];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-md text-xs font-medium"
      style={{
        padding: '6px 10px',
        background: c.bg,
        color: c.fg,
        border: `1.5px solid ${c.border}`,
      }}
    >
      {children ?? (
        <>
          <span>{SHIFT_LABEL[shiftType]}</span>
          {showTime && (
            <span className="font-mono text-[11px] opacity-80">
              {SHIFT_TIME[shiftType]}
            </span>
          )}
        </>
      )}
    </span>
  );
}
