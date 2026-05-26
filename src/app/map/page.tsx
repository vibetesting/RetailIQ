import MapLayout from "@/components/map/MapLayout";

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            R
          </div>
          <span className="font-semibold text-sm text-gray-900">RetailIQ</span>
          <span className="text-gray-400 text-xs">Retail Explorer</span>
        </div>
        <a
          href="/"
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← Dashboard
        </a>
      </header>

      <div className="flex-1 overflow-hidden">
        <MapLayout />
      </div>
    </div>
  );
}
