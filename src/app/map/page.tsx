import MapLayout from "@/components/map/MapLayout";

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/80 flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/25">
            R
          </div>
          <div>
            <span className="font-bold text-sm text-gray-900 tracking-tight">RetailIQ</span>
            <span className="ml-2 text-gray-400 text-xs font-medium">Retail Explorer</span>
          </div>
        </div>
        <a
          href="/"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors duration-150 font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard
        </a>
      </header>

      <div className="flex-1 overflow-hidden">
        <MapLayout />
      </div>
    </div>
  );
}
