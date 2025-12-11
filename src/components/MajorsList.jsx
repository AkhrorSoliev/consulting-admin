import { useEffect, useMemo, useState } from "react";
import { subscribeToCollections, deleteCollectionByName } from "../utils";
import { Link, useNavigate } from "react-router-dom";
import { FaLink, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { useUserRole } from "../hooks/useUserRole";

export default function MajorsList() {
  const [majors, setMajors] = useState([]);
  const navigate = useNavigate();
  const { role } = useUserRole();
  const isLimitedAdmin = useMemo(() => role === "limited_admin", [role]);
  const handleCopyLink = (major) => {
    const link = `https://consulting-admin.vercel.app/create?major=${major}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        toast.success("Link in die Zwischenablage kopiert!");
      })
      .catch(() => {
        toast.error("Link konnte nicht kopiert werden");
      });
  };

  const handleDeleteMajor = async (major) => {
    if (isLimitedAdmin) {
      toast.error("Sie haben keine Berechtigung, Berufsfelder zu löschen.");
      return;
    }
    if (window.confirm(`Möchten Sie „${major}“ wirklich löschen?`)) {
      try {
        await deleteCollectionByName(major);
        navigate(`/`);
      } catch (error) {}
    }
  };
  useEffect(() => {
    const unsub = subscribeToCollections((names) => {
      setMajors(names);
    });

    return () => unsub();
  }, []);

  return (
    <div>
      {majors.length === 0 ? (
        <div className="text-center opacity-70 py-8 text-sm">
          <p>Derzeit keine Berufsfelder vorhanden.</p>
          <p className="mt-1">
            Klicken Sie auf „Neues Berufsfeld“, um zu beginnen.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {majors.map((major) => (
            <li
              key={major}
              className="flex w-full items-center gap-2 rounded-lg border border-base-200 p-2 hover:bg-base-200/50 transition-colors"
            >
              {!isLimitedAdmin && (
                <button
                  onClick={() => handleDeleteMajor(major)}
                  className="btn btn-sm btn-error"
                  aria-label={`„${major}“ löschen`}
                >
                  <FaTrash />
                </button>
              )}
              <button
                onClick={() => handleCopyLink(major)}
                className="btn btn-sm btn-neutral"
                aria-label={`Link für „${major}“ kopieren`}
              >
                <FaLink />
              </button>
              <Link
                //  to={`/create?major=${major}`}
                to={`collectionCv/${major}`}
                className="btn btn-sm btn-outline-info grow justify-start overflow-hidden min-w-0"
                title={major}
              >
                <span className="font-medium truncate">{major}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
