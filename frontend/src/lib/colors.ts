export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT';

const POSITION_HUES = [280, 20, 140, 210, 50, 330, 180, 100];

export function positionHue(position: string | null | undefined): number {
  if (!position) return 25;
  let h = 0;
  for (let i = 0; i < position.length; i++) {
    h = (h * 31 + position.charCodeAt(i)) | 0;
  }
  return POSITION_HUES[Math.abs(h) % POSITION_HUES.length];
}

export function positionColors(position: string | null | undefined) {
  const hue = positionHue(position);
  return {
    bg: `oklch(0.92 0.06 ${hue})`,
    fg: `oklch(0.32 0.12 ${hue})`,
    border: `oklch(0.55 0.16 ${hue})`,
    dot: `oklch(0.55 0.16 ${hue})`,
  };
}

export const SHIFT_LABEL: Record<ShiftType, string> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  NIGHT: 'Night',
};

export const SHIFT_TIME: Record<ShiftType, string> = {
  MORNING: '07:00 - 15:00',
  AFTERNOON: '15:00 - 22:00',
  NIGHT: '22:00 - 02:00',
};

export const SHIFT_COLORS: Record<
  ShiftType,
  { bg: string; fg: string; border: string }
> = {
  MORNING: {
    bg: 'var(--shift-morning-soft)',
    fg: 'oklch(0.30 0.12 240)',
    border: 'var(--shift-morning)',
  },
  AFTERNOON: {
    bg: 'var(--shift-afternoon-soft)',
    fg: 'oklch(0.28 0.12 195)',
    border: 'var(--shift-afternoon)',
  },
  NIGHT: {
    bg: 'var(--shift-night-soft)',
    fg: 'oklch(0.30 0.12 280)',
    border: 'var(--shift-night)',
  },
};

export function initialsOf(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}
