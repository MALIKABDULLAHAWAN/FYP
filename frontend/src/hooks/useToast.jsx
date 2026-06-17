import { createContext, useContext, useState, useCallback, useRef } from "react";
import UiIcon from "../components/ui/UiIcon";

const ToastContext = createContext(null);

let toastId = 0;

const TOAST_ICON = {
  success: "toast-success",
  error: "toast-error",
  info: "toast-info",
  warning: "toast-warning",
  achievement: "toast-achievement",
  celebration: "toast-celebration",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

      if (duration > 0) {
        timers.current[id] = setTimeout(() => {
          removeToast(id);
          delete timers.current[id];
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = useCallback(
    {
      success: (msg, dur) => addToast(msg, "success", dur),
      error: (msg, dur) => addToast(msg, "error", dur),
      info: (msg, dur) => addToast(msg, "info", dur),
      warning: (msg, dur) => addToast(msg, "warning", dur),
      achievement: (msg, dur) => addToast(msg, "achievement", dur),
      celebration: (msg, dur) => addToast(msg, "celebration", dur),
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type} ${t.exiting ? "toast-exit" : ""}`}
          >
            <span className="toast-icon">
              <UiIcon name={TOAST_ICON[t.type] || "toast-info"} size={22} title="" />
            </span>
            <span className="toast-msg">{t.message}</span>
            <button type="button" className="toast-close" onClick={() => removeToast(t.id)} aria-label="Close">
              <UiIcon name="close" size={16} title="Close" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
