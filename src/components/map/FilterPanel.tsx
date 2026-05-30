"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFilterStore } from "@/lib/filter-store";
import { ASSET_OPTIONS, CONFIDENCE_LEVELS, colorForStoreType, labelStoreType } from "@/lib/store-types";
import { iconForStoreType } from "@/lib/store-type-icons";
import type { FilterOptions } from "@/types";

interface FilterPanelProps {
  options: FilterOptions;
}

export default function FilterPanel({ options }: FilterPanelProps) {
  const { filters, setFilter, toggleArray, reset } = useFilterStore();

  const activeCount =
    (filters.state ? 1 : 0) +
    (filters.city ? 1 : 0) +
    filters.storeTypes.length +
    filters.categories.length +
    filters.brands.length +
    filters.assets.length +
    filters.confidence.length +
    (filters.minRating != null ? 1 : 0) +
    (filters.maxRating != null ? 1 : 0) +
    (filters.minReviews != null ? 1 : 0) +
    (filters.brandsIdentified !== "any" ? 1 : 0) +
    (filters.categoriesIdentified !== "any" ? 1 : 0);

  return (
    <aside className="flex h-full w-[300px] flex-col border-r border-border bg-sidebar flex-shrink-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Filters</h2>
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="h-7 gap-1 text-xs">
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-2">
        <Accordion
          type="multiple"
          defaultValue={["location", "type", "categories", "confidence"]}
          className="space-y-1"
        >
          {/* LOCATION */}
          <Section value="location" label="Location">
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">State</Label>
                <Select
                  value={filters.state || "__all"}
                  onValueChange={(v) => setFilter("state", v === "__all" ? "" : v)}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All states</SelectItem>
                    {options.states.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">City</Label>
                <Select
                  value={filters.city || "__all"}
                  onValueChange={(v) => setFilter("city", v === "__all" ? "" : v)}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="All cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All cities</SelectItem>
                    {options.cities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {/* STORE TYPE */}
          <Section value="type" label={`Store Type (${options.storeTypes.length})`}>
            <div className="grid grid-cols-1 gap-1.5">
              {options.storeTypes.length === 0 && (
                <p className="px-1 py-2 text-[11px] italic text-muted-foreground">No store types yet.</p>
              )}
              {options.storeTypes.map((t) => {
                const Icon = iconForStoreType(t);
                const color = colorForStoreType(t);
                return (
                  <label
                    key={t}
                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-accent/40"
                  >
                    <Checkbox
                      checked={filters.storeTypes.includes(t)}
                      onCheckedChange={() => toggleArray("storeTypes", t)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                        style={{ background: color }}
                      >
                        <Icon className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      {labelStoreType(t)}
                    </span>
                  </label>
                );
              })}
            </div>
          </Section>

          {/* DETAILS (brands/categories identified) */}
          <Section value="identified" label="Details">
            <div className="space-y-2">
              <YesNoRow
                label="Brands identified"
                value={filters.brandsIdentified}
                onChange={(v) => setFilter("brandsIdentified", v)}
              />
              <YesNoRow
                label="Categories identified"
                value={filters.categoriesIdentified}
                onChange={(v) => setFilter("categoriesIdentified", v)}
              />
            </div>
          </Section>

          {/* CATEGORIES */}
          <Section value="categories" label={`Categories (${options.categories.length})`}>
            <SearchableCheckList
              items={options.categories}
              selected={filters.categories}
              onToggle={(v) => toggleArray("categories", v)}
              placeholder="Search categories…"
              emptyText="No categories yet — run analysis to populate."
            />
          </Section>

          {/* BRANDS */}
          <Section value="brands" label={`Brands (${options.brands.length})`}>
            <SearchableCheckList
              items={options.brands}
              selected={filters.brands}
              onToggle={(v) => toggleArray("brands", v)}
              placeholder="Search brands…"
              emptyText="No brands detected yet."
            />
          </Section>

          {/* ASSETS */}
          <Section value="assets" label="Assets">
            <SearchableCheckList
              items={ASSET_OPTIONS.map((a) => a.key)}
              labels={Object.fromEntries(ASSET_OPTIONS.map((a) => [a.key, a.label]))}
              selected={filters.assets}
              onToggle={(v) => toggleArray("assets", v)}
              placeholder="Search assets…"
              emptyText="No assets available."
            />
          </Section>

          {/* CONFIDENCE */}
          <Section value="confidence" label="Confidence">
            {CONFIDENCE_LEVELS.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-accent/40"
              >
                <Checkbox
                  checked={filters.confidence.includes(c)}
                  onCheckedChange={() => toggleArray("confidence", c)}
                  className="h-3.5 w-3.5"
                />
                <span className="capitalize">{c}</span>
              </label>
            ))}
          </Section>

          {/* RATINGS & REVIEWS */}
          <Section value="ratings" label="Ratings & Reviews">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <NumInput
                  label="Min rating"
                  value={filters.minRating}
                  onChange={(v) => setFilter("minRating", v)}
                  step={0.1}
                  max={5}
                  min={0}
                />
                <NumInput
                  label="Max rating"
                  value={filters.maxRating}
                  onChange={(v) => setFilter("maxRating", v)}
                  step={0.1}
                  max={5}
                  min={0}
                />
              </div>
              <NumInput
                label="Min reviews"
                value={filters.minReviews}
                onChange={(v) => setFilter("minReviews", v)}
              />
            </div>
          </Section>
        </Accordion>
      </div>
    </aside>
  );
}

function Section({
  value,
  label,
  children,
}: {
  value: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={value} className="border-b-0">
      <AccordionTrigger className="rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent/40 hover:no-underline [&>svg]:h-3.5 [&>svg]:w-3.5">
        {label}
      </AccordionTrigger>
      <AccordionContent className="px-2 pb-2 pt-0">{children}</AccordionContent>
    </AccordionItem>
  );
}

function NumInput({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div>
      <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="mt-1 h-8 text-xs"
        {...rest}
      />
    </div>
  );
}

function SearchableCheckList({
  items,
  selected,
  onToggle,
  placeholder,
  emptyText,
  labels,
}: {
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
  placeholder: string;
  emptyText: string;
  labels?: Record<string, string>;
}) {
  const [q, setQ] = useState("");
  const ql = q.trim().toLowerCase();
  const filtered = ql ? items.filter((i) => (labels?.[i] ?? i).toLowerCase().includes(ql)) : items;
  const selectedSet = new Set(selected);
  const selectedInList = items.filter((i) => selectedSet.has(i));
  const merged = [...selectedInList, ...filtered.filter((i) => !selectedSet.has(i))];

  return (
    <div className="space-y-1.5">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="h-7 text-xs"
      />
      {selected.length > 0 && (
        <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground">
          <span>{selected.length} selected</span>
          <button
            type="button"
            className="hover:text-foreground"
            onClick={() => selected.forEach((v) => onToggle(v))}
          >
            Clear
          </button>
        </div>
      )}
      <div className="scrollbar-thin max-h-44 overflow-y-auto pr-1">
        {items.length === 0 && (
          <p className="px-1 py-2 text-[11px] italic text-muted-foreground">{emptyText}</p>
        )}
        {items.length > 0 && merged.length === 0 && (
          <p className="px-1 py-2 text-[11px] italic text-muted-foreground">No matches.</p>
        )}
        {merged.map((v) => (
          <label
            key={v}
            className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-accent/40"
          >
            <Checkbox
              checked={selectedSet.has(v)}
              onCheckedChange={() => onToggle(v)}
              className="h-3.5 w-3.5"
            />
            <span className="select-none">{labels?.[v] ?? v}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function YesNoRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "any" | "yes" | "no";
  onChange: (v: "any" | "yes" | "no") => void;
}) {
  const opts: { v: "any" | "yes" | "no"; l: string }[] = [
    { v: "any", l: "Any" },
    { v: "yes", l: "Yes" },
    { v: "no", l: "No" },
  ];
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
      <div className="inline-flex w-full rounded-md border border-border bg-background p-0.5">
        {opts.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={`flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              value === o.v
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/40"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
