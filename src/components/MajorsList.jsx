import { useEffect, useState } from "react";
import { subscribeToCollections } from "../utils";
import { Link } from "react-router-dom";
import { FaLink, FaTrash } from "react-icons/fa";

export default function MajorsList() {
  const [majors, setMajors] = useState([]);
  useEffect(() => {
    const unsub = subscribeToCollections((names) => {
      setMajors(names);
    });

    return () => unsub();
  }, []);

  return (
    <div>
      <ul className="flex flex-col gap-5">
        {majors.map((major) => (
          <li className="flex w-full gap-2">
            <button className="btn btn-sm btn-error">
              <FaTrash />
            </button>
            <button className="btn btn-sm btn-neutral">
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
