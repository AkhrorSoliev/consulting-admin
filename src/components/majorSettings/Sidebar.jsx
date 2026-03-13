import { FaComments, FaBuilding, FaUserTie } from "react-icons/fa";
import { FaLink } from "react-icons/fa6";

const tabs = [
  { key: "link", label: "Link", Icon: FaLink },
  { key: "internal", label: "Ichki suxbat", Icon: FaComments },
  { key: "leadership", label: "Orif Aka bilan suxbat", Icon: FaUserTie },
  { key: "employer", label: "Ish beruvchi", Icon: FaBuilding },
];

export default function Sidebar({ tab, setTab }) {
  return (
    <aside className="w-56 shrink-0 border-r border-base-300/50 bg-base-200/20 p-3">
      <ul className="menu rounded-box p-2 w-full gap-1">
        {tabs.map(({ key, label, Icon }) => (
          <li key={key}>
            <button
              type="button"
              className={`w-full justify-start gap-2 ${
                tab === key
                  ? "bg-neutral text-neutral-content font-semibold"
                  : ""
              }`}
              onClick={() => setTab(key)}
            >
              <Icon
                className={`text-lg ${
                  tab === key
                    ? "text-neutral-content"
                    : "text-base-content/70"
                }`}
              />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
