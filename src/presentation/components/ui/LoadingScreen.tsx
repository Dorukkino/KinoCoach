export function LoadingScreen({
  label = "Yükleniyor...",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`loading-screen ${className}`} role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden />
      <span className="loading-label">{label}</span>
    </div>
  );
}
