import Link from "next/link";

const STATS = [
  { label: "AI Pipelines", value: "Live", sub: "Image qual + brand + asset + store type", dot: "bg-green-400" },
  { label: "H3 Mapping", value: "Ready", sub: "Spatial hexagonal intelligence", dot: "bg-amber-400" },
  { label: "Supabase", value: "Connected", sub: "Full schema + RLS", dot: "bg-green-400" },
  { label: "n8n Workflows", value: "Running", sub: "Self-hosted on Hostinger VPS", dot: "bg-green-400" },
];

const CAPABILITIES = [
  {
    title: "Retail Intelligence",
    items: ["Brand detection", "Product category detection", "Asset detection", "Store type classification"],
    icon: "🏪",
  },
  {
    title: "Geo Intelligence",
    items: ["H3 heatmaps", "Whitespace analysis", "Competitor mapping", "POI overlays"],
    icon: "🗺️",
  },
  {
    title: "AI Capabilities",
    items: ["Image qualification", "Shelf analysis", "Storefront analysis", "Conversational geo reasoning"],
    icon: "🤖",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-bold text-lg">
            R
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight">RetailIQ</h1>
            <p className="text-[var(--muted)] text-xs">AI-powered retail geo-intelligence</p>
          </div>
        </div>
        <Link
          href="/map"
          className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm rounded-lg transition-colors font-medium"
        >
          Open Map →
        </Link>
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
              <span className="text-xs text-[var(--muted)] font-medium">{stat.label}</span>
            </div>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {CAPABILITIES.map((cap) => (
          <div
            key={cap.title}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5"
          >
            <div className="text-2xl mb-3">{cap.icon}</div>
            <h3 className="font-semibold text-sm mb-3">{cap.title}</h3>
            <ul className="space-y-1.5">
              {cap.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="w-1 h-1 rounded-full bg-[var(--accent)] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Data flow */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4 text-[var(--muted)] uppercase tracking-wider">
          Data Flow
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            "CSV Upload",
            "n8n Webhook",
            "Store Insert",
            "Image Download",
            "Image Qualification",
            "AI Analysis",
            "Aggregation",
            "H3 Spatial Index",
            "Frontend Render",
          ].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-md">
                {step}
              </span>
              {i < arr.length - 1 && (
                <span className="text-[var(--muted)]">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
