import { useEffect, useMemo, useRef, useState } from "react";
import countries from "../utils/const";

function normalizeText(v) {
  return String(v || "").trim().toLowerCase();
}

function getPriorityIndex(country) {
  const flag = String(country?.flagSvg || "").toLowerCase();
  // Prefer flag matching (most reliable even if name has encoding issues)
  if (flag.includes("/uz.svg")) return 0; // Usbekistan
  if (flag.includes("/de.svg")) return 1; // Deutschland
  if (flag.includes("/ru.svg")) return 2; // Russland
  if (flag.includes("/kr.svg")) return 3; // S Korea

  const name = normalizeText(country?.deu);
  if (name.includes("usbek")) return 0;
  if (name.includes("deutsch")) return 1;
  if (name.includes("russ")) return 2;
  if (name.includes("korea")) return 3;
  return 999;
}

function sortWithPriority(list) {
  return [...list].sort((a, b) => {
    const pa = getPriorityIndex(a);
    const pb = getPriorityIndex(b);
    if (pa !== pb) return pa - pb;
    return String(a?.deu || "").localeCompare(String(b?.deu || ""), undefined, {
      sensitivity: "base",
    });
  });
}

export default function CountryNameCombobox({
  id,
  label,
  required = false,
  placeholder = "Usbekistan",
  value,
  onChange,
  error,
  inputClassName = "",
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    // Important: when opening, show full list even if current value is set (e.g. "Deutschland")
    // so user can browse all countries. Only filter by the active query.
    const q = normalizeText(query);
    const list = Array.isArray(countries) ? countries : [];
    if (!q) return sortWithPriority(list);
    return sortWithPriority(list.filter((c) => normalizeText(c?.deu).includes(q)));
  }, [query]);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  return (
    <div ref={rootRef} className="form-control w-full relative">
      {label ? (
        <label htmlFor={id} className="label">
          <span className="label-text">
            {label}
            {required && typeof label === "string" ? " *" : ""}
          </span>
        </label>
      ) : null}

      <input
        id={id}
        type="text"
        className={`input input-bordered w-full ${inputClassName} ${
          error ? "input-error" : ""
        }`}
        placeholder={placeholder}
        value={String(value || "")}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setOpen(true);
          setQuery(e.target.value);
          onChange?.(e.target.value);
        }}
        autoComplete="off"
        aria-invalid={error ? "true" : "false"}
      />

      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-box border border-base-300 bg-base-100 shadow-lg max-h-64 overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm opacity-70">Keine Ergebnisse</div>
          ) : (
            <ul className="menu menu-sm">
              {filtered.map((c) => {
                const name = String(c?.deu || "").trim();
                const flag = String(c?.flagSvg || "").trim();
                if (!name) return null;
                return (
                  <li key={name}>
                    <button
                      type="button"
                      className="flex items-center gap-2"
                      onClick={() => {
                        onChange?.(name);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      {flag ? (
                        <img
                          src={flag}
                          alt=""
                          className="w-5 h-4 object-cover rounded-sm"
                          loading="lazy"
                        />
                      ) : null}
                      <span className="flex-1 text-left">{name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {error ? <p className="text-error text-sm mt-1">{error}</p> : null}
    </div>
  );
}


