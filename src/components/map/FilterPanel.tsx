"use client";

import { useState, useMemo } from "react";
import type { StoreFilters, FilterOptions } from "@/types";
import { DEFAULT_FILTERS } from "@/types";

interface FilterPanelProps {
  filters: StoreFilters;
  options: FilterOptions;
  onChange: (filters: StoreFilters) => void;
}

const ASSETS = ["Visi Cooler", "Racks", "POSM", "Impulse Display", "Outside Display", "Bulk Storage Visible"];
const CONFIDENCE_LEVELS = ["High", "Medium", "Low"];

const STORE_TYPE_COLORS: Record<string, string> = {
  Grocery: "bg-green-100 text-green-700",
  Hardware: "bg-orange-100 text-orange-700",
  Others: "bg-gray-100 text-gray-600",
  Pharmacy: "bg-red-100 text-red-700",
  Supermarket: "bg-blue-100 text-blue-700",
  Unknown: "bg-gray-100 text-gray-500",
};

const STORE_TYPE_ICONS: Record<string, string> = {
  Grocery: "🛒", Hardware: "🔧", Others: "⚙️",
  Pharmacy: "💊", Supermarket: "🏪", Unknown: "❓",
};

export default function FilterPanel({ filters, options, onChange }: FilterPanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    categories: true,
    brands: true,
  });
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");

  const toggle = (section: string) =>
    setCollapsed((c) => ({ ...c, [section]: !c[section] }));

  const set = <K extends keyof StoreFilters>(key: K, value: StoreFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const toggleArr = (key: "storeTypes" | "categories" | "brands" | "assets" | "confidence", val: string) => {
    const arr = filters[key] as string[];
    set(key, arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  // Active filter chips
  const chips = useMemo(() => {
    const result: { label: string; onRemove: () => void }[] = [];
    if (filters.state) result.push({ label: filters.state, onRemove: () => set("state", "") });
    if (filters.city) result.push({ label: filters.city, onRemove: () => set("city", "") });
    filters.storeTypes.forEach((t) => result.push({ label: t, onRemove: () => toggleArr("storeTypes", t) }));
    if (filters.brandsIdentified !== "any") result.push({ label: `Brands: ${filters.brandsIdentified}`, onRemove: () => set("brandsIdentified", "any") });
    if (filters.categoriesIdentified !== "any") result.push({ label: `Categories: ${filters.categoriesIdentified}`, onRemove: () => set("categoriesIdentified", "any") });
    filters.categories.forEach((c) => result.push({ label: c, onRemove: () => toggleArr("categories", c) }));
    filters.brands.forEach((b) => result.push({ label: b, onRemove: () => toggleArr("brands", b) }));
    filters.assets.forEach((a) => result.push({ label: a, onRemove: () => toggleArr("assets", a) }));
    filters.confidence.forEach((c) => result.push({ label: `${c} conf.`, onRemove: () => toggleArr("confidence", c) }));
    if (filters.minRating !== null) result.push({ label: `≥${filters.minRating}★`, onRemove: () => set("minRating", null) });
    if (filters.maxRating !== null) result.push({ label: `≤${filters.maxRating}★`, onRemove: () => set("maxRating", null) });
    if (filters.minReviews !== null) result.push({ label: `≥${filters.minReviews} reviews`, onRemove: () => set("minReviews", null) });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const isActive = chips.length > 0;

  const visibleCategories = options.categories.filter((c) =>
    c.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const visibleBrands = options.brands.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );

  return (
    <div className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full shadow-[1px_0_0_0_#f1f5f9]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-semibold text-sm text-gray-800">Filters</span>
          {isActive && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">{chips.length}</span>
          )}
        </div>
        {isActive && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors duration-150 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reset all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="px-4 py-2.5 flex flex-wrap gap-1.5 border-b border-gray-100 bg-blue-50/50">
          {chips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-blue-200 text-[11px] font-medium text-blue-700 shadow-sm"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="ml-0.5 text-blue-400 hover:text-blue-700 transition-colors"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* LOCATION */}
        <Section
          title="LOCATION"
          collapsed={collapsed.location}
          onToggle={() => toggle("location")}
          badge={[filters.state, filters.city].filter(Boolean).length}
        >
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium tracking-wide uppercase">State</label>
              <select
                value={filters.state}
                onChange={(e) => set("state", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-150"
              >
                <option value="">All states</option>
                {options.states.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium tracking-wide uppercase">City</label>
              <select
                value={filters.city}
                onChange={(e) => set("city", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-150"
              >
                <option value="">All cities</option>
                {options.cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* STORE TYPE */}
        <Section
          title="STORE TYPE"
          collapsed={collapsed.storeType}
          onToggle={() => toggle("storeType")}
          badge={filters.storeTypes.length}
          count={options.storeTypes.length}
        >
          <div className="space-y-0.5">
            {options.storeTypes.map((t) => (
              <CheckRow
                key={t}
                checked={filters.storeTypes.includes(t)}
                onChange={() => toggleArr("storeTypes", t)}
                label={t}
                prefix={STORE_TYPE_ICONS[t] ?? "●"}
                chipColor={STORE_TYPE_COLORS[t]}
              />
            ))}
          </div>
        </Section>

        {/* IDENTIFIED */}
        <Section title="IDENTIFIED" collapsed={collapsed.identified} onToggle={() => toggle("identified")}
          badge={(filters.brandsIdentified !== "any" ? 1 : 0) + (filters.categoriesIdentified !== "any" ? 1 : 0)}
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Brands Identified</p>
              <TriToggle value={filters.brandsIdentified} onChange={(v) => set("brandsIdentified", v)} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Categories Identified</p>
              <TriToggle value={filters.categoriesIdentified} onChange={(v) => set("categoriesIdentified", v)} />
            </div>
          </div>
        </Section>

        {/* CATEGORIES */}
        <Section
          title="CATEGORIES"
          collapsed={collapsed.categories}
          onToggle={() => toggle("categories")}
          badge={filters.categories.length}
          count={options.categories.length}
        >
          <div>
            <SearchBox value={categorySearch} onChange={setCategorySearch} placeholder="Search categories..." />
            <div className="mt-2 max-h-52 overflow-y-auto space-y-0.5 pr-1">
              {visibleCategories.map((c) => (
                <CheckRow key={c} checked={filters.categories.includes(c)} onChange={() => toggleArr("categories", c)} label={c} />
              ))}
              {visibleCategories.length === 0 && <p className="text-xs text-gray-400 py-2 text-center">No matches</p>}
            </div>
          </div>
        </Section>

        {/* BRANDS */}
        <Section
          title="BRANDS"
          collapsed={collapsed.brands}
          onToggle={() => toggle("brands")}
          badge={filters.brands.length}
          count={options.brands.length}
        >
          <div>
            <SearchBox value={brandSearch} onChange={setBrandSearch} placeholder="Search brands..." />
            <div className="mt-2 max-h-52 overflow-y-auto space-y-0.5 pr-1">
              {visibleBrands.map((b) => (
                <CheckRow key={b} checked={filters.brands.includes(b)} onChange={() => toggleArr("brands", b)} label={b} />
              ))}
              {visibleBrands.length === 0 && <p className="text-xs text-gray-400 py-2 text-center">No matches</p>}
            </div>
          </div>
        </Section>

        {/* ASSETS */}
        <Section title="ASSETS" collapsed={collapsed.assets} onToggle={() => toggle("assets")} badge={filters.assets.length}>
          <div className="space-y-0.5">
            {ASSETS.map((a) => (
              <CheckRow key={a} checked={filters.assets.includes(a)} onChange={() => toggleArr("assets", a)} label={a} />
            ))}
          </div>
        </Section>

        {/* CONFIDENCE */}
        <Section title="CONFIDENCE" collapsed={collapsed.confidence} onToggle={() => toggle("confidence")} badge={filters.confidence.length}>
          <div className="space-y-0.5">
            {CONFIDENCE_LEVELS.map((c) => (
              <CheckRow
                key={c}
                checked={filters.confidence.includes(c.toLowerCase())}
                onChange={() => toggleArr("confidence", c.toLowerCase())}
                label={c}
                dot={c === "High" ? "bg-green-400" : c === "Medium" ? "bg-amber-400" : "bg-red-400"}
              />
            ))}
          </div>
        </Section>

        {/* RATINGS & REVIEWS */}
        <Section
          title="RATINGS & REVIEWS"
          collapsed={collapsed.ratings}
          onToggle={() => toggle("ratings")}
          badge={[filters.minRating, filters.maxRating, filters.minReviews].filter((v) => v !== null).length}
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">Min Rating</label>
                <input
                  type="number" min={0} max={5} step={0.1}
                  value={filters.minRating ?? ""}
                  onChange={(e) => set("minRating", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-150"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">Max Rating</label>
                <input
                  type="number" min={0} max={5} step={0.1}
                  value={filters.maxRating ?? ""}
                  onChange={(e) => set("maxRating", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="5"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-150"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">Min Reviews</label>
              <input
                type="number" min={0}
                value={filters.minReviews ?? ""}
                onChange={(e) => set("minReviews", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-150"
              />
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}

// ---- Sub-components ----

function Section({
  title, children, collapsed, onToggle, badge = 0, count,
}: {
  title: string; children: React.ReactNode; collapsed: boolean;
  onToggle: () => void; badge?: number; count?: number;
}) {
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/80 transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-gray-500 tracking-widest">{title}</span>
          {count !== undefined && (
            <span className="text-[10px] text-gray-400">({count})</span>
          )}
          {badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        style={{
          maxHeight: collapsed ? 0 : 600,
          overflow: "hidden",
          transition: "max-height 250ms ease-out",
        }}
      >
        <div className="px-4 pb-3">{children}</div>
      </div>
    </div>
  );
}

function CheckRow({
  checked, onChange, label, prefix, chipColor, dot,
}: {
  checked: boolean; onChange: () => void; label: string;
  prefix?: string; chipColor?: string; dot?: string;
}) {
  return (
    <label className={`flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 transition-colors duration-150 ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`}>
      <div className={`w-4 h-4 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150 ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      {dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />}
      {prefix && !dot && <span className="text-sm flex-shrink-0">{prefix}</span>}
      <span className={`text-sm font-medium capitalize flex-1 truncate transition-colors duration-150 ${checked ? "text-blue-700" : "text-gray-700"}`}>
        {chipColor ? (
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${chipColor}`}>{label}</span>
        ) : label}
      </span>
    </label>
  );
}

function TriToggle({ value, onChange }: { value: "any" | "yes" | "no"; onChange: (v: "any" | "yes" | "no") => void }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-200 p-0.5 bg-gray-50 gap-0.5">
      {(["any", "yes", "no"] as const).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all duration-150 capitalize ${
            value === opt
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-150 bg-gray-50 focus:bg-white"
      />
    </div>
  );
}
