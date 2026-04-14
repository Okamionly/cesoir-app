export default function Loading() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-3xl text-accent animate-pulse">☾</span>
        <p className="text-xs text-text-muted font-medium">Chargement...</p>
      </div>
    </div>
  );
}
