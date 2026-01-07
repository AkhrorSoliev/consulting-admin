import { useEffect, useMemo, useRef, useState } from "react";
import countries from "../utils/const";

function digitsOnly(v) {
  return String(v || "").replace(/[^\d]/g, "");
}

function formatMaskedBody(raw, countryPhone) {
  const d = digitsOnly(raw);
  const phone = String(countryPhone || "").trim();

  // Russia: +7 XXX XXX-XX-XX (3-3-2-2, 10 digits)
  if (phone === "+7") {
    const limited = d.slice(0, 10);
    const parts = [];
    let i = 0;
    const groups = [3, 3, 2, 2];
    for (const g of groups) {
      const chunk = limited.slice(i, i + g);
      if (!chunk) break;
      parts.push(chunk);
      i += g;
    }
    return parts.join(" ");
  }

  // Default: 00 000 00 00 (2-3-2-2, 9 digits)
  const limited = d.slice(0, 9);
  const parts = [];
  let i = 0;
  const groups = [2, 3, 2, 2];
  for (const g of groups) {
    const chunk = limited.slice(i, i + g);
    if (!chunk) break;
    parts.push(chunk);
    i += g;
  }
  return parts.join(" ");
}

function normalizeText(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

function getDefaultCountry() {
  const list = Array.isArray(countries) ? countries : [];
  return (
    list.find((c) => normalizeText(c?.deu) === "usbekistan") ||
    list.find((c) =>
      String(c?.flagSvg || "")
        .toLowerCase()
        .includes("/uz.svg")
    ) ||
    list.find((c) => String(c?.phone || "").trim() === "+998") ||
    list.find((c) => normalizeText(c?.deu) === "deutschland") ||
    list.find((c) => String(c?.phone || "").trim() === "+49") ||
    list[0] || { deu: "Deutschland", phone: "+49", flagSvg: "" }
  );
}

function getPriorityIndex(country) {
  const flag = String(country?.flagSvg || "").toLowerCase();
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

function findCountryByPhonePrefix(full) {
  const v = String(full || "").trim();
  if (!v) return null;
  const list = Array.isArray(countries) ? countries : [];
  const normalized = v.replace(/\s+/g, "");
  // Sort by phone code length desc so +390... matches before +39, etc.
  const sorted = [...list].sort(
    (a, b) => String(b?.phone || "").length - String(a?.phone || "").length
  );
  return (
    sorted.find((c) => {
      const p = String(c?.phone || "").trim();
      if (!p) return false;
      return normalized.startsWith(p.replace(/\s+/g, ""));
    }) || null
  );
}

function stripPhonePrefix(full, phonePrefix) {
  const v = String(full || "").trim();
  const p = String(phonePrefix || "").trim();
  if (!v || !p) return v;
  const normalized = v.replace(/\s+/g, " ");
  const prefix = p.replace(/\s+/g, " ");
  if (normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length).trim();
  }
  // Also try without spaces for safety
  const ns = v.replace(/\s+/g, "");
  const ps = p.replace(/\s+/g, "");
  if (ns.startsWith(ps)) {
    return ns.slice(ps.length).trim();
  }
  return v;
}

export default function PhoneInputWithCountry({
  label,
  required = false,
  value,
  onChange,
  error,
  helperText,
  inputClassName = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });
  const helpId = useMemo(
    () => `phone-help-${Math.random().toString(36).slice(2)}`,
    []
  );
  const errorId = useMemo(
    () => `phone-error-${Math.random().toString(36).slice(2)}`,
    []
  );

  const inferredCountry = useMemo(
    () => findCountryByPhonePrefix(value) || getDefaultCountry(),
    [value]
  );

  const [selected, setSelected] = useState(inferredCountry);

  useEffect(() => {
    setSelected(inferredCountry);
  }, [inferredCountry]);

  useEffect(() => {
    // Track window size for mobile vs desktop UI
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    const list = Array.isArray(countries) ? countries : [];
    if (!q) return sortWithPriority(list);
    return sortWithPriority(
      list.filter((c) => {
        const name = normalizeText(c?.deu);
        const phone = normalizeText(c?.phone);
        return name.includes(q) || phone.includes(q);
      })
    );
  }, [query]);

  const body = useMemo(() => {
    const phonePrefix = String(selected?.phone || "").trim();
    const rest = stripPhonePrefix(value, phonePrefix);
    return formatMaskedBody(rest, phonePrefix);
  }, [value, selected]);

  return (
    <>
      <div className="form-control w-full">
        {label ? (
          <label className="label">
            <span className="label-text">
              {label}
              {required && typeof label === "string" ? " *" : ""}
            </span>
          </label>
        ) : null}

        <div className="join w-full">
          {isMobile ? (
            <button
              type="button"
              className={`join-item input input-bordered flex items-center w-[120px] justify-start gap-2 ${inputClassName} ${
                error ? "input-error" : ""
              }`}
              onClick={() => setOpen(true)}
            >
              {selected?.flagSvg ? (
                <img
                  src={selected.flagSvg}
                  alt=""
                  className="w-5 h-4 object-cover rounded-sm"
                  loading="lazy"
                />
              ) : null}
              <span className="">{String(selected?.phone || "")}</span>
            </button>
          ) : (
            <select
              className={`join-item select select-bordered w-[120px] ${inputClassName} ${
                error ? "select-error" : ""
              }`}
              value={String(selected?.phone || "")}
              onChange={(e) => {
                const phone = e.target.value;
                const country = filtered.find(
                  (c) => String(c?.phone || "").trim() === phone
                );
                if (country) {
                  setSelected(country);
                  const nextBody = body
                    ? ` ${formatMaskedBody(body, phone)}`
                    : "";
                  onChange?.(`${phone}${nextBody}`.trim());
                }
              }}
            >
              {sortWithPriority(countries).map((c) => {
                const phone = String(c?.phone || "").trim();
                const name = String(c?.deu || "").trim();
                if (!phone || !name) return null;
                return (
                  <option key={phone} value={phone}>
                    {phone}
                  </option>
                );
              })}
            </select>
          )}

          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={`join-item input input-bordered w-full ${inputClassName} ${
              error ? "input-error" : ""
            }`}
            placeholder={
              String(selected?.phone || "").trim() === "+7"
                ? "000 000 00 00"
                : "00 000 00 00"
            }
            aria-invalid={error ? "true" : "false"}
            aria-describedby={[error ? errorId : "", helperText ? helpId : ""]
              .filter(Boolean)
              .join(" ")}
            value={body}
            onChange={(e) => {
              const prefix = String(selected?.phone || "").trim();
              const nextBody = formatMaskedBody(e.target.value, prefix);
              const next = nextBody ? `${prefix} ${nextBody}` : prefix;
              onChange?.(next.trim());
            }}
          />
        </div>

        {error ? (
          <p id={errorId} className="text-error text-sm mt-1">
            {error}
          </p>
        ) : null}
        {helperText ? (
          <p id={helpId} className="mt-1 text-xs text-base-content/70">
            {helperText}
          </p>
        ) : null}
      </div>

      {/* Bottom Sheet: Country Code Picker (Mobile Only) */}
      {isMobile && open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
          onClick={() => {
            setOpen(false);
            setQuery("");
          }}
        >
          <div
            className="fixed inset-x-0 bottom-0 bg-base-100 rounded-t-3xl max-h-[70vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="shrink-0 pt-3 pb-2 flex justify-center">
              <div className="w-12 h-1 bg-base-300 rounded-full" />
            </div>

            {/* Header with search */}
            <div className="shrink-0 px-4 pb-3 border-b border-base-200">
              <h3 className="font-bold text-lg text-center mb-3">
                Davlat kodini tanlang
              </h3>
              <input
                className="input input-bordered w-full"
                placeholder="Qidirish..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus={
                  typeof window !== "undefined" && window.innerWidth >= 1024
                }
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-3 space-y-1">
                {filtered.length === 0 ? (
                  <div className="p-3 text-sm opacity-70 text-center">
                    Keine Ergebnisse gefunden
                  </div>
                ) : (
                  filtered.map((c) => {
                    const name = String(c?.deu || "").trim();
                    const phone = String(c?.phone || "").trim();
                    if (!name || !phone) return null;
                    const isSelected =
                      selected?.phone === phone && selected?.deu === name;
                    return (
                      <button
                        key={`${name}__${phone}`}
                        type="button"
                        onClick={() => {
                          setSelected(c);
                          const nextBody = body
                            ? ` ${formatMaskedBody(body, phone)}`
                            : "";
                          onChange?.(`${phone}${nextBody}`.trim());
                          setOpen(false);
                          setQuery("");
                        }}
                        className={`
                          w-full text-left px-4 py-3 rounded-xl transition-all
                          flex items-center gap-3
                          active:scale-98
                          ${
                            isSelected
                              ? "bg-primary text-primary-content"
                              : "hover:bg-base-200 active:bg-base-300"
                          }
                        `}
                      >
                        {c?.flagSvg ? (
                          <img
                            src={c.flagSvg}
                            alt=""
                            className="w-6 h-5 object-cover rounded-sm shrink-0"
                            loading="lazy"
                          />
                        ) : null}
                        <span className="flex-1 font-medium">{name}</span>
                        <span className="text-sm opacity-70 font-mono">
                          {phone}
                        </span>
                        {isSelected && <span className="ml-2">✓</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
