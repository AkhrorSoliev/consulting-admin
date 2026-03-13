export default function ArchivedInfoAlert() {
  return (
    <div className="alert alert-info">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="stroke-current shrink-0 w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <div className="text-sm">
        <p className="font-semibold">Muhim ma'lumot:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>O'chirilgan yo'nalishlardagi kandidatlar saqlanadi</li>
          <li>Kandidatlarni ko'rish va tahrirlash mumkin</li>
          <li>
            Yo'nalishni qayta tiklash orqali Sidebar ga qaytarish mumkin
          </li>
        </ul>
      </div>
    </div>
  );
}
