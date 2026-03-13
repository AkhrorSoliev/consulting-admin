import { FaChevronDown } from "react-icons/fa";

/**
 * Floating button to dismiss the mobile keyboard.
 * Only rendered when a text input is focused on mobile.
 */
export default function KeyboardDismissButton({ isInputFocused, isMobile }) {
  if (!isInputFocused || !isMobile) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary hover:bg-primary-focus text-primary-content rounded-full p-4 shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center"
      aria-label="Klaviyaturani yopish"
    >
      <FaChevronDown className="text-xl" />
    </button>
  );
}
