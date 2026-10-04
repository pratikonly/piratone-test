import { useEffect, useState } from "react";

const ShortcutLoadingOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "F4") return;

      event.preventDefault();
      setIsVisible((visible) => !visible);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="shortcut-loading-overlay"
      role="status"
      aria-live="polite"
      aria-label="Please wait"
    >
      <div className="shortcut-loading-content">
        <div className="shortcut-loading-spinner" aria-hidden="true" />
        <span>Please wait...</span>
      </div>
    </div>
  );
};

export default ShortcutLoadingOverlay;