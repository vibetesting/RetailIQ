import MapClientWrapper from "@/components/map/MapClientWrapper";

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
            R
          </div>
          <span className="font-semibold text-sm">RetailIQ</span>
          <span className="text-[var(--muted)] text-xs">Geo Intelligence</span>
        </div>
        <a
          href="/"
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Dashboard
        </a>
      </header>

      <div className="flex-1 relative">
        <MapClientWrapper />
      </div>
    </div>
  );
}
