import { FaTelegram } from "react-icons/fa";

export default function LeadStats({ leadStats }) {
  return (
    <div className="mb-6 p-4 rounded-box border border-base-300 bg-base-100 shadow-sm">
      <div className="flex flex-wrap gap-4 items-start">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <span className="font-semibold text-primary">{leadStats.total}</span>
          <span className="text-sm text-base-content/70">Gesamt</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20">
          <FaTelegram className="w-5 h-5 text-[#0088cc]" />
          <span className="font-semibold text-[#0088cc]">
            {leadStats.telegramCount}
          </span>
          <span className="text-sm text-base-content/70">Telegram</span>
        </div>
        {leadStats.leadList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {leadStats.leadList.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20"
              >
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {item.count}
                </span>
                <span className="text-sm text-purple-600 dark:text-purple-400">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
