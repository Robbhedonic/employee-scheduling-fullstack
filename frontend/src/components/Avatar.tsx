import { initialsOf, positionHue } from '@/lib/colors';

type Props = {
  firstName: string;
  lastName: string;
  position?: string | null;
  size?: number;
  ring?: boolean;
};

export function Avatar({
  firstName,
  lastName,
  position,
  size = 36,
  ring = false,
}: Props) {
  const hue = positionHue(position);
  const bg = `oklch(0.88 0.07 ${hue})`;
  const fg = `oklch(0.35 0.12 ${hue})`;
  return (
    <div
      className="inline-flex items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.35),
        background: bg,
        color: fg,
        boxShadow: ring
          ? '0 0 0 2px var(--paper), 0 0 0 4px var(--ink)'
          : undefined,
      }}
    >
      {initialsOf(firstName, lastName)}
    </div>
  );
}
