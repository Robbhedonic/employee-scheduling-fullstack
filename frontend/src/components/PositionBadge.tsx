import { positionColors } from '@/lib/colors';

type Props = {
  position: string | null | undefined;
  size?: 'sm' | 'md';
};

export function PositionBadge({ position, size = 'sm' }: Props) {
  if (!position) return null;
  const c = positionColors(position);
  const isLg = size === 'md';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{
        height: isLg ? 28 : 22,
        padding: isLg ? '0 12px' : '0 8px',
        fontSize: isLg ? 12 : 11,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 6, height: 6, background: c.dot }}
      />
      {position}
    </span>
  );
}
