"use client";

import { useEffect } from "react";

export type ToastState = { message: string; kind: "success" | "error" } | null;

/**
 * Minimal top-right toast (DESIGN.md: green `#D0E7D2` success alert). Auto-
 * dismisses; errors use the red token. Full toast-stack infra stays later.
 */
export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      className={`fixed right-4 top-4 z-50 max-w-sm rounded-md px-4 py-3 text-sm font-medium shadow-raised ${
        toast.kind === "success"
          ? "bg-success text-on-surface"
          : "bg-error text-white"
      }`}
    >
      {toast.message}
    </div>
  );
}
