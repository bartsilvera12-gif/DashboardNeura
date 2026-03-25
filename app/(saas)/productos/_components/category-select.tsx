"use client";

import { useState, useRef, useEffect } from "react";
import type { CompanyCategory } from "@/lib/config/company-categories-service";

interface CategorySelectProps {
  name: string;
  categories: CompanyCategory[];
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const SEARCH_THRESHOLD = 6;

export function CategorySelect({
  name,
  categories,
  defaultValue = "",
  required = false,
  disabled = false,
  placeholder = "Buscar o elegir categoría",
}: CategorySelectProps) {
  const [value, setValue] = useState(defaultValue);
  const [filter, setFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const showSearch = categories.length > SEARCH_THRESHOLD;
  const filtered = filter.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(filter.toLowerCase())
      )
    : categories;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayText = value
    ? categories.find((c) => c.name === value)?.name ?? value
    : placeholder;

  const handleSelect = (cat: CompanyCategory) => {
    setValue(cat.name);
    setFilter("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <input type="hidden" name={name} value={value} readOnly />
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className="w-full min-w-0 rounded border border-zinc-300 bg-white px-2 py-1.5 text-left text-sm text-zinc-700 disabled:bg-zinc-100 disabled:text-zinc-500"
      >
        <span
          className={`block truncate ${value ? "" : "text-zinc-400"}`}
          title={displayText}
        >
          {displayText}
        </span>
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded border border-zinc-200 bg-white py-1 shadow-lg">
          {showSearch && (
            <div className="border-b border-zinc-100 px-2 pb-1">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Escribir para buscar…"
                className="w-full rounded border border-zinc-200 px-2 py-1 text-sm focus:border-zinc-400 focus:outline-none"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-40 overflow-y-auto">
            {!required && (
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  setFilter("");
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-50"
              >
                — Sin categoría —
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-zinc-500">
                No hay coincidencias
              </div>
            ) : (
              filtered.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 ${
                    value === cat.name ? "bg-zinc-100 font-medium" : ""
                  }`}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
