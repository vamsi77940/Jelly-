export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-base-bg text-ink-muted">
      <div className="relative group">
        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-75 blur-md animate-pulse" />
        <img
          src="/jelly-logo.png"
          alt="Jelly"
          className="relative w-16 h-16 rounded-2xl object-cover border border-cyan-300/50 shadow-2xl shadow-cyan-500/50"
        />
      </div>
      <h1 className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
        Jelly
      </h1>
      <p className="text-xs text-ink-muted animate-pulse">Initializing OS…</p>
    </div>
  );
}
