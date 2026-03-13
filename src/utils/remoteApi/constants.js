export const EMAIL_API_BASE = "https://json-api.uz/api/project/consultinguz";
export const UPLOAD_DELETE_ENDPOINT = `${EMAIL_API_BASE}/upload/delete`;
export const USERS_ALL_ENDPOINT = `${EMAIL_API_BASE}/all_users`;
export const USERS_DELETED_ENDPOINT = `${EMAIL_API_BASE}/deleted_users`;
export const USERS_ARCHIVED_ENDPOINT = `${EMAIL_API_BASE}/archived_users`;
export const ALL_EMAILS_ENDPOINT_PRIMARY = `${EMAIL_API_BASE}/all_Emails`;
export const ALL_EMAILS_ENDPOINT_FALLBACK = `${EMAIL_API_BASE}/all_emails`;

export function omitKeys(obj, keys) {
  const source = obj && typeof obj === "object" ? obj : {};
  const set = new Set(Array.isArray(keys) ? keys : []);
  const out = {};
  Object.keys(source).forEach((k) => {
    if (!set.has(k)) out[k] = source[k];
  });
  return out;
}

export async function safeJsonResponse(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}
