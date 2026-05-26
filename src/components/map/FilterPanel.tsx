"use client";

import { useState } from "react";
import type { StoreFilters, FilterOptions } from "@/types";
import { DEFAULT_FILTERS } from "@/types";

interface FilterPanelProps {
  filters: StoreFilters;
  options: FilterOptions;
  onChange: (filters: StoreFilters) => void;
}

const ASSETS = ["Visi Cooler", "Racks", "POSM", "Impulse Display", "Outside Display", "Bulk Storage Visible"];
const CONFIDENCE_LEVELS = ["High", "Medium", "Low"];

const STORE_TYPE_ICONS: Record<string, string> = {
  Grocery: "🛒",
  Hardware: "🔧",
  Others: "⚙️",
  Pharmacy: "💊",
  Supermarket: "🏪",
  Unknown: "❓",
};

export default function FilterPanel({ filters, options, onChange }: FilterPanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [assetSearch, setAssetSearch] = useState("");

  const toggle = (section: string) =>
    setCollapsed((c) => ({ ...c, [section]: !c[section] }));

  const set = <K extends keyof StoreFilters>(key: K, value: StoreFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const toggleArr = (key: "storeTypes" | "categories" | "brands" | "assets" | "confidence", val: string) => {
    const arr = filters[key] as string[];
    set(key, arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const isActive = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  const visibleCategories = options.categories.filter((c) =>
    c.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const visibleBrands = options.brands.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );
  const visibleAssets = ASSETS.filter((a) =>
    a.toLowerCase().includes(assetSearch.toLowerCase())
  );

  return (
    <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <span className="font-semibold text-sm text-gray-800">Filters</span>
        {isActive && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* LOCATION */}
        <Section title="LOCATION" collapsed={collapsed.location} onToggle={() => toggle("location")}>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">State</label>
              <select
                value={filters.state}
                onChange={(e) => set("state", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All states</option>
                {options.states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">City</label>
              <select
                value={filters.city}
                onChange={(e) => set("city", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All cities</option>
                {options.cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* STORE TYPE */}
        <Section
          title={`STORE TYPE${options.storeTypes.length ? ` (${options.storeTypes.length})` : ""}`}
          collapsed={collapsed.storeType}
          onToggle={() => toggle("storeType")}
        >
          <div className="space-y-1">
            {options.storeTypes.map((t) => (
              <CheckRow
                key={t}
                checked={filters.storeTypes.includes(t)}
                onChange={() => toggleArr("storeTypes", t)}
                label={t}
                prefix={STORE_TYPE_ICONS[t] ?? "●"}
              />
            ))}
          </div>
        </Section>

        {/* IDENTIFIED */}
        <Section title="IDENTIFIED" collapsed={collapsed.identified} onToggle={() => toggle("identified")}>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Brands Identified</p>
              <TriToggle
                value={filters.brandsIdentified}
                onChange={(v) => set("brandsIdentified", v)}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Categories Identified</p>
              <TriToggle
                value={filters.categoriesIdentified}
                onChange={(v) => set("categoriesIdentified", v)}
              />
            </div>
          </div>
        </Section>

        {/* CATEGORIES */}
        <Section
          title={`CATEGORIES${options.categories.length ? ` (${options.categories.length})` : ""}`}
          collapsed={collapsed.categories}
          onToggle={() => toggle("categories")}
        >
          <div>
            <SearchBox value={categorySearch} onChange={setCategorySearch} placeholder="Search categories..." />
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1 pr-1">
              {visibleCategories.map((c) => (
                <CheckRow
                  key={c}
                  checked={filters.categories.includes(c)}
                  onChange={() => toggleArr("categories", c)}
                  label={c}
                />
              ))}
              {visibleCategories.length === 0 && (
                <p className="text-xs text-gray-400 py-1">No matches</p>
              )}
            </div>
          </div>
        </Section>

        {/* BRANDS */}
        <Section
          title={`BRANDS${options.brands.length ? ` (${options.brands.length})` : ""}`}
          collapsed={collapsed.brands}
          onToggle={() => toggle("brands")}
        >
          <div>
            <SearchBox value={brandSearch} onChange={setBrandSearch} placeholder="Search brands..." />
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1 pr-1">
              {visibleBrands.map((b) => (
                <CheckRow
                  key={b}
                  checked={filters.brands.includes(b)}
                  onChange={() => toggleArr("brands", b)}
                  label={b}
                />
              ))}
              {visibleBrands.length === 0 && (
                <p className="text-xs text-gray-400 py-1">No matches</p>
              )}
            </div>
          </div>
        </Section>

        {/* ASSETS */}
        <Section title="ASSETS" collapsed={collapsed.assets} onToggle={() => toggle("assets")}>
          <div>
            <SearchBox value={assetSearch} onChange={setAssetSearch} placeholder="Search assets..." />
            <div className="mt-2 space-y-1">
              {visibleAssets.map((a) => (
                <CheckRow
                  key={a}
                  checked={filters.assets.includes(a)}
                  onChange={() => toggleArr("assets", a)}
                  label={a}
                />
              ))}
            </div>
          </div>
        </Section>

        {/* CONFIDENCE */}
        <Section title="CONFIDENCE" collapsed={collapsed.confidence} onToggle={() => toggle("confidence")}>
          <div className="space-y-1">
            {CONFIDENCE_LEVELS.map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.confidence.includes(c.toLowerCase())}
                  onChange={() => toggleArr("confidence", c.toLowerCase())}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{c}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* RATINGS & REVIEWS */}
        <Section title="RATINGS & REVIEWS" collapsed={collapsed.ratings} onToggle={() => toggle("ratings")}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Min Rating</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={filters.minRating ?? ""}
                  onChange={(e) => set("minRating", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Max Rating</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={filters.maxRating ?? ""}
                  onChange={(e) => set("maxRating", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="5"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min Reviews</label>
              <input
                type="number"
                min={0}
                value={filters.minReviews ?? ""}
                onChange={(e) => set("minReviews", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
  title,
  children,
  collapsed,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-600 tracking-wider">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {!collapsed && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  prefix,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  prefix?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      {prefix && <span className="text-sm">{prefix}</span>}
      <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">{label}</span>
    </label>
  );
}

function TriToggle({
  value,
  onChange,
}: {
  value: "any" | "yes" | "no";
  onChange: (v: "any" | "yes" | "no") => void;
}) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200">
      {(["any", "yes", "no"] as const).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 text-xs py-1.5 font-medium transition-colors capitalize ${
            value === opt
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
