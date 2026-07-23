import { useCallback, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import clsx from "clsx";

export type ToastType = "success" | "error";

interface ToastState {
  id: number;
  type: ToastType;
  message: string;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = Date.now();
    setToast({ id, type, message });
    timerRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  }, []);

  return { toast, showToast };
}

export function Toast({ toast }: { toast: { type: ToastType; message: string } | null }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:justify-end sm:pr-8">
      <div
        className={clsx(
          "pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg",
          isSuccess ? "bg-success-600" : "bg-danger-600",
        )}
      >
        {isSuccess ? <CheckCircle2 size={16} className="shrink-0" /> : <XCircle size={16} className="shrink-0" />}
        {toast.message}
      </div>
    </div>
  );
}
