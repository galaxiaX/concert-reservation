"use client";

import { useEffect, useRef } from "react";

/**
 * Centered 422px delete-confirmation modal over a rgba(0,0,0,0.4) scrim
 * (DESIGN.md modal + Admin Dashboard screen spec). Escape and scrim click
 * cancel; the destructive confirm button takes initial focus.
 */
export function DeleteConcertModal({
  concertName,
  pending,
  onCancel,
  onConfirm,
}: {
  concertName: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[422px] rounded-md bg-surface p-6 text-center shadow-modal"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-tertiary text-white">
          <XIcon />
        </div>

        <p id="delete-modal-title" className="mt-4 font-semibold">
          Are you sure to delete?
        </p>
        <p className="font-semibold">“{concertName}”</p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border border-border bg-surface px-6 py-2.5 font-medium text-on-surface transition hover:bg-neutral"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-sm bg-tertiary px-6 py-2.5 font-medium text-white transition hover:bg-tertiary/90 disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
