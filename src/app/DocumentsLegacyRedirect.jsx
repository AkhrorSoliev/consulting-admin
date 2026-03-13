import { Navigate, useParams } from "react-router-dom";

export default function DocumentsLegacyRedirect() {
  const { templateId } = useParams();
  const t = String(templateId || "").trim();
  return (
    <Navigate
      to={t ? `/settings/documents/${t}` : "/settings/documents"}
      replace
    />
  );
}
