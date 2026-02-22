export default function CandidateIntroCard({ candidateName }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-primary rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0 hidden sm:block">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">
            Hurmatli {candidateName || "Foydalanuvchi"}!
          </h2>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            Hujjatlarni sifatli va adashib ketmagan holda yuklashingizni
            so'raymiz. Iltimos, har bir hujjatni diqqat bilan tekshirib, to'g'ri
            joyga yuklang.
          </p>
        </div>
      </div>
    </div>
  );
}
