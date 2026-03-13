import {
  EMAIL_API_BASE,
  ALL_EMAILS_ENDPOINT_PRIMARY,
  ALL_EMAILS_ENDPOINT_FALLBACK,
} from "./constants";
import { checkEmailRemote } from "./emailPassportCheck";

// ---- Email/Passport registration (remote API) ----

export async function registerEmailRemote(email, major, passportNumber) {
  const safeEmail = String(email || "").trim();
  if (!safeEmail) return;

  const safePassportId = String(passportNumber || "")
    .trim()
    .toUpperCase();

  const res = await fetch(ALL_EMAILS_ENDPOINT_PRIMARY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: safeEmail,
      major: String(major || "").trim() || null,
      ...(safePassportId ? { passportId: safePassportId } : {}),
    }),
  });
  if (!res.ok) {
    if (res.status === 404) {
      const res2 = await fetch(ALL_EMAILS_ENDPOINT_FALLBACK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: safeEmail,
          major: String(major || "").trim() || null,
          ...(safePassportId ? { passportId: safePassportId } : {}),
        }),
      });
      if (!res2.ok)
        throw new Error(`E-Mail Registrierung fehlgeschlagen: ${res2.status}`);
      return res2.json().catch(() => ({}));
    }
    throw new Error(`E-Mail Registrierung fehlgeschlagen: ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

export async function registerPassportRemote(passportNumber, major) {
  const safePassport = String(passportNumber || "")
    .trim()
    .toUpperCase();
  if (!safePassport) return;

  const res = await fetch(`${EMAIL_API_BASE}/all_Passports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      passport: safePassport,
      major: String(major || "").trim() || null,
    }),
  });
  if (res.status === 404) {
    return { ok: false, unavailable: true, status: 404 };
  }
  if (!res.ok)
    throw new Error(`Passnummer Registrierung fehlgeschlagen: ${res.status}`);
  return res.json().catch(() => ({}));
}

export async function deleteEmailRemote(email) {
  const safeEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!safeEmail) return;

  const tryDeleteById = async (baseEndpoint) => {
    const getRes = await fetch(
      `${baseEndpoint}?email=${encodeURIComponent(safeEmail)}`,
      { method: "GET" },
    );
    if (!getRes.ok) return { ok: false, status: getRes.status };
    const json = await getRes.json().catch(() => ({}));
    const list = Array.isArray(json?.data) ? json.data : [];
    const match =
      list.find(
        (item) =>
          String(item?.email || "")
            .trim()
            .toLowerCase() === safeEmail,
      ) || null;
    if (!match) return { ok: true, deleted: false, reason: "not-found" };

    const id =
      match.id ?? match._id ?? match.uuid ?? match.key ?? match.docId ?? null;
    if (id !== null && id !== undefined && String(id).trim() !== "") {
      const delRes = await fetch(
        `${baseEndpoint}/${encodeURIComponent(String(id))}`,
        { method: "DELETE" },
      );
      if (delRes.ok) return { ok: true, deleted: true, via: "id" };
      return { ok: false, status: delRes.status };
    }

    const byPropUrl = `${baseEndpoint}/by-property?property=email&value=${encodeURIComponent(
      safeEmail,
    )}&all=false`;
    const del2 = await fetch(byPropUrl, { method: "DELETE" });
    if (del2.ok) return { ok: true, deleted: true, via: "by-property" };
    return { ok: false, status: del2.status };
  };

  const a = await tryDeleteById(ALL_EMAILS_ENDPOINT_PRIMARY);
  if (a.ok) return a;
  const b = await tryDeleteById(ALL_EMAILS_ENDPOINT_FALLBACK);
  if (b.ok) return b;
  throw new Error(`E-Mail Löschung fehlgeschlagen: ${a.status || b.status}`);
}

export async function updateEmailRemote(oldEmail, newEmail, major) {
  const oldSafe = String(oldEmail || "")
    .trim()
    .toLowerCase();
  const nextSafe = String(newEmail || "")
    .trim()
    .toLowerCase();
  if (!oldSafe || !nextSafe) return;
  if (oldSafe === nextSafe) return;

  try {
    const { exists, data } = await checkEmailRemote(oldSafe);
    if (exists && data && typeof data === "object") {
      const id =
        data.id ?? data._id ?? data.uuid ?? data.key ?? data.docId ?? null;
      if (id !== null && id !== undefined && String(id).trim() !== "") {
        const res = await fetch(
          `${EMAIL_API_BASE}/all_Emails/${encodeURIComponent(String(id))}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: String(newEmail || "").trim(),
              major: String(major || "").trim() || null,
            }),
          },
        );
        if (res.ok) return res.json().catch(() => ({}));
      }
    }
  } catch {
    // ignore and fallback
  }

  try {
    await deleteEmailRemote(oldSafe);
  } catch {
    // ignore delete failure
  }
  return registerEmailRemote(String(newEmail || "").trim(), major);
}
