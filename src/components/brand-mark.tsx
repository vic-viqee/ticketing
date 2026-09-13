export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="24"
        cy="24"
        r="19"
        className="fill-transparent stroke-foreground"
        strokeWidth="3.5"
      />
      <circle
        cx="24"
        cy="24"
        r="11"
        className="fill-transparent stroke-brand"
        strokeWidth="3.5"
      />
      <circle cx="24" cy="24" r="3.5" className="fill-brand" />
    </svg>
  );
}