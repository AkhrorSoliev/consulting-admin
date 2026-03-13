// Upload a single File to consultinguz external storage and return a URL string
export async function uploadFileToConsulting(file) {
  if (!(file instanceof File)) {
    throw new Error("uploadFileToConsulting: file must be a File");
  }
  const formData = new FormData();
  formData.append("file", file, file.name);
  const response = await fetch(
    "https://json-api.uz/api/project/consultinguz/upload",
    {
      method: "POST",
      body: formData,
    },
  );
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  const contentType = String(
    response.headers.get("content-type") || "",
  ).toLowerCase();
  const rawText = await response.text();
  let parsed;
  if (contentType.includes("application/json")) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = undefined;
    }
  } else {
    parsed = rawText;
  }

  let urlCandidate = null;
  if (typeof parsed === "string") {
    urlCandidate = parsed;
  } else if (parsed && typeof parsed === "object") {
    if (typeof parsed.url === "string") urlCandidate = parsed.url;
    else if (typeof parsed.link === "string") urlCandidate = parsed.link;
    else if (parsed.data) {
      if (typeof parsed.data === "string") urlCandidate = parsed.data;
      else if (typeof parsed.data?.url === "string")
        urlCandidate = parsed.data.url;
      else if (typeof parsed.data?.link === "string")
        urlCandidate = parsed.data.link;
    } else if (Array.isArray(parsed)) {
      const firstUrl = parsed.find(
        (v) => typeof v === "string" && /^https?:\/\//.test(v),
      );
      if (firstUrl) urlCandidate = firstUrl;
    }
  }

  if (!urlCandidate || !/^https?:\/\//.test(String(urlCandidate))) {
    throw new Error("Upload succeeded but response did not contain a URL.");
  }
  return String(urlCandidate);
}

// Upload multiple files and return an array of URL strings (preserves order)
export async function uploadFilesToConsulting(files) {
  if (!files) return [];
  const arr = Array.from(files).filter((f) => f instanceof File);
  if (arr.length === 0) return [];
  const results = [];
  for (const f of arr) {
    // eslint-disable-next-line no-await-in-loop
    const url = await uploadFileToConsulting(f);
    results.push(url);
  }
  return results;
}
