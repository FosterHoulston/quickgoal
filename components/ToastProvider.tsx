"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastTone = "default" | "success" | "error";

type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

const TOAST_DURATION = 4000;

let toastIdCounter = 0;
const nextToastId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  toastIdCounter += 1;
  return `toast-${toastIdCounter}`;
};

const toneClassName: Record<ToastTone, string> = {
  success:
    "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]",
  error:
    "border-[color:var(--color-danger-strong)] bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger-strong)]",
  default:
    "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-subtle)]",
};

type ToastContextValue = {
  pushToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type ToastProviderProps = {
  children: React.ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<number[]>([]);

  const pushToast = useCallback((message: string, tone: ToastTone = "default") => {
    const id = nextToastId();
    setToasts((current) => [...current, { id, message, tone }]);
    const timeout = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      timeoutsRef.current = timeoutsRef.current.filter((item) => item !== timeout);
    }, TOAST_DURATION);
    timeoutsRef.current.push(timeout);
  }, []);

  // Without this, a toast pending when the tree unmounts fires setState on a
  // dead component.
  useEffect(
    () => () => {
      timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
      timeoutsRef.current = [];
    },
    [],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex w-[280px] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-fade rounded-2xl border px-4 py-3 text-xs shadow-lg ${toneClassName[toast.tone]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
