import { useEffect, useState } from "react";
import { subscribeToCollections, deleteCollectionByName } from "../utils";
import { Link } from "react-router-dom";
import { FaLink, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

export default function MajorsList() {
  const [majors, setMajors] = useState([]);

  const handleCopyLink = (major) => {
    const link = `https://consulting-admin.vercel.app/create?major=${major}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        toast.success("Link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  const handleDeleteMajor = async (major) => {
    if (window.confirm(`Are you sure you want to delete "${major}"?`)) {
      try {
        await deleteCollectionByName(major);
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
      <ul className="flex flex-col gap-5">
        {majors.map((major, i) => (
          <li key={i} className="flex w-full gap-2">
            <button
              onClick={() => handleDeleteMajor(major)}
              className="btn btn-sm btn-error"
            >
              <FaTrash />
            </button>
            <button
              onClick={() => handleCopyLink(major)}
              className="btn btn-sm btn-neutral"
            >
              <FaLink />
            </button>
            <Link
              //  to={`/create?major=${major}`}
              to={`collectionCv/${major}`}
              key={major}
              className="btn btn-sm btn-outline-info grow"
            >
              <span className="font-medium">{major.slice(0, 8)}...</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
