"use client";

import { useMemo, useState } from "react";
import { DEPARTMENT_ENTRIES } from "@/lib/constants";

export default function DepartmentAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return DEPARTMENT_ENTRIES.slice(0, 8);
    return DEPARTMENT_ENTRIES.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.aliases.some((alias) => alias.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [value]);

  return (
    <div className="relative">
      <input
        className="input"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Start typing, e.g. CSE or Sociology"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg">
          {suggestions.map((d) => (
            <li key={d.name}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(d.name);
                  setOpen(false);
                }}
                className="flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-navy/5"
              >
                <span className="text-navy">{d.name}</span>
                <span className="shrink-0 text-xs text-muted">{d.school}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
