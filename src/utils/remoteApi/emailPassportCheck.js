import {
  EMAIL_API_BASE,
  ALL_EMAILS_ENDPOINT_PRIMARY,
  ALL_EMAILS_ENDPOINT_FALLBACK,
} from "./constants";

// ---- Email/Passport validation (remote API) ----

export async function checkEmailRemote(email) {
  const safeEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!safeEmail) return { exists: false };

  const tryGet = async (base) => {
    const url = `${base}?email=${encodeURIComponent(safeEmail)}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    const json = await res.json().catch(() => ({}));
    const list = Array.isArray(json?.data) ? json.data : [];
    const match =
      list.find(
        (item) =>
          String(item?.email || "")
            .trim()
            .toLowerCase() === safeEmail,
      ) || null;
    return { ok: true, status: 200, data: match };
  };

  const a = await tryGet(ALL_EMAILS_ENDPOINT_PRIMARY);
  if (a.ok) return a.data ? { exists: true, data: a.data } : { exists: false };
  const b = await tryGet(ALL_EMAILS_ENDPOINT_FALLBACK);
  if (b.ok) return b.data ? { exists: true, data: b.data } : { exists: false };
  throw new Error(
    `E-Mail Prüfung fehlgeschlagen: ${a.status || b.status || "unknown"}`,
  );
}

export async function checkPassportRemote(passportNumber) {
  const safePassport = String(passportNumber || "")
    .trim()
    .toUpperCase();
  if (!safePassport) return { exists: false };

  const res = await fetch(`${EMAIL_API_BASE}/all_Emails`, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Passnummer Prüfung fehlgeschlagen: ${res.status}`);
  }
  const json = await res.json().catch(() => ({}));
  const list = Array.isArray(json?.data) ? json.data : [];
  const match =
    list.find((item) => {
      const p =
        item?.passportId ??
        item?.passport ??
        item?.passportNumber ??
        item?.reisepass ??
        item?.reisepassNummer ??
        "";
      return (
        String(p || "")
          .trim()
          .toUpperCase() === safePassport
      );
    }) || null;
  if (match) return { exists: true, data: match };
  return { exists: false };
}
