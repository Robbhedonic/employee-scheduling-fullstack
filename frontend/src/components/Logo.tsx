type Props = {
  size?: number;
};

export function LogoMark({ size = 28 }: Props) {
  return (
    <span
      className="inline-flex items-center justify-center bg-ink text-paper italic"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        fontFamily: 'var(--font-display)',
        fontSize: Math.round(size * 0.58),
        letterSpacing: '-0.02em',
      }}
    >
      S
    </span>
  );
}

export function Logo({ size = 22 }: Props) {
  return (
    <span
      className="inline-flex items-center gap-2.5 font-display text-ink"
      style={{ fontSize: size }}
    >
      <LogoMark />
      <span>Sundsgården</span>
    </span>
  );
}
