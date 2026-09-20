interface ProgressBarProps {
  value: number; // 0-100
  label: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full h-3 rounded-full bg-base-raised overflow-hidden"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-mint transition-[width] duration-700 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
