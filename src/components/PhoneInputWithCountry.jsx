import { useEffect, useMemo, useRef, useState } from "react";
import countries from "../utils/const";

function digitsOnly(v) {
  return String(v || "").replace(/[^\d]/g, "");
}

function formatMaskedBody(raw) {
  const d = digitsOnly(raw);
  // Mask style: 00 000 00 00 (2-3-2-2)
  const parts = [];
  let i = 0;
  const groups = [2, 3, 2, 2];
  for (const g of groups) {
    const chunk = d.slice(i, i + g);
    if (!chunk) break;
    parts.push(chunk);
    i += g;
  }
  const rest = d.slice(i);
  if (rest) parts.push(rest);
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
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const inferredCountry = useMemo(
    () => findCountryByPhonePrefix(value) || getDefaultCountry(),
    [value]
  );

  const [selected, setSelected] = useState(inferredCountry);

  useEffect(() => {
    setSelected(inferredCountry);
  }, [inferredCountry]);

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
    return formatMaskedBody(rest);
  }, [value, selected]);

  return (
    <div ref={rootRef} className="form-control w-full">
      {label ? (
        <label className="label">
          <span className="label-text">
            {label}
            {required && typeof label === "string" ? " *" : ""}
          </span>
        </label>
      ) : null}

      <div className="join w-full">
        <div className="join-item relative">
          <button
            type="button"
            className={`join-item input input-bordered flex   items-center w-[88px] justify-start gap-2 ${
              error ? "input-error" : ""
            }`}
            onClick={() => setOpen((v) => !v)}
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

          {open ? (
            <div className="absolute z-50 mt-1 w-[340px] max-w-[85vw] rounded-box border border-base-300 bg-base-100 shadow-lg">
              <div className="p-2 border-b border-base-200">
                <input
                  className="input input-bordered w-full"
                  placeholder="Land oder Code suchen…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-auto">
                {filtered.length === 0 ? (
                  <div className="p-3 text-sm opacity-70">Keine Ergebnisse</div>
                ) : (
                  <ul className="menu menu-sm">
                    {filtered.map((c) => {
                      const name = String(c?.deu || "").trim();
                      const phone = String(c?.phone || "").trim();
                      if (!name || !phone) return null;
                      return (
                        <li key={`${name}__${phone}`}>
                          <button
                            type="button"
                            className="flex items-center gap-2"
                            onClick={() => {
                              setSelected(c);
                              const nextBody = body ? ` ${body}` : "";
                              onChange?.(`${phone}${nextBody}`.trim());
                              setOpen(false);
                              setQuery("");
                            }}
                          >
                            {c?.flagSvg ? (
                              <img
                                src={c.flagSvg}
                                alt=""
                                className="w-5 h-4 object-cover rounded-sm"
                                loading="lazy"
                              />
                            ) : null}
                            <span className="flex-1 text-left">{name}</span>
                            <span className="text-xs opacity-70">{phone}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={`join-item input input-bordered w-full ${
            error ? "input-error" : ""
          }`}
          placeholder="00 000 00 00"
          aria-invalid={error ? "true" : "false"}
          value={body}
          onChange={(e) => {
            const nextBody = formatMaskedBody(e.target.value);
            const prefix = String(selected?.phone || "").trim();
            const next = nextBody ? `${prefix} ${nextBody}` : prefix;
            onChange?.(next.trim());
          }}
        />
      </div>

      {error ? <p className="text-error text-sm mt-1">{error}</p> : null}
    </div>
  );
}
