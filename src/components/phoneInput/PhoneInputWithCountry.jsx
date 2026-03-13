import { useEffect, useMemo, useState } from "react";
import countries from "../../utils/const";
import {
  normalizeText,
  getDefaultCountry,
  sortWithPriority,
  findCountryByPhonePrefix,
  stripPhonePrefix,
  formatMaskedBody,
} from "./phoneUtils";
import CountryBottomSheet from "./CountryBottomSheet";

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

      {isMobile && (
        <CountryBottomSheet
          open={open}
          filtered={filtered}
          selected={selected}
          body={body}
          query={query}
          setQuery={setQuery}
          setSelected={setSelected}
          setOpen={setOpen}
          onChange={onChange}
        />
      )}
    </>
  );
}
