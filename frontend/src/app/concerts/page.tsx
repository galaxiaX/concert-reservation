"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Toast, type ToastState } from "@/components/Toast";
import { ApiError, concertsApi, reservationsApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Concert } from "@/lib/types";

const seats = new Intl.NumberFormat("en-US");

export default function ConcertsPage() {
  const router = useRouter();
  const [concerts, setConcerts] = useState<Concert[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const load = useCallback(async () => {
    try {
      setConcerts(await concertsApi.list());
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to load concerts.",
      );
    }
  }, []);

  // localStorage is client-only — guard and fetch after mount.
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login?as=user");
      return;
    }
    void (async () => {
      await load();
    })();
  }, [router, load]);

  async function handleReserve(concert: Concert) {
    setPendingId(concert.id);
    try {
      await reservationsApi.reserve(concert.id);
      setToast({ message: `Reserved "${concert.name}".`, kind: "success" });
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : "Reservation failed.",
        kind: "error",
      });
    } finally {
      // Refetch either way: on a race-lost 409 this clears the stale state.
      await load();
      setPendingId(null);
    }
  }

  async function handleCancel(concert: Concert) {
    if (!concert.reservationId) return;
    setPendingId(concert.id);
    try {
      await reservationsApi.cancel(concert.reservationId);
      setToast({ message: `Canceled "${concert.name}".`, kind: "success" });
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : "Cancellation failed.",
        kind: "error",
      });
    } finally {
      // Refetch either way: on a race-lost 409 this clears the stale state.
      await load();
      setPendingId(null);
    }
  }

  return (
    <AppShell role="USER" active="home">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[32px] font-semibold sm:text-[40px]">Concerts</h1>
        <Link
          href="/concerts/history"
          className="text-base font-medium text-secondary transition hover:underline"
        >
          My reservations →
        </Link>
      </div>

      {loadError && (
        <p className="mt-6 text-error" role="alert">
          {loadError}
        </p>
      )}

      {concerts === null && !loadError && (
        <p className="mt-6 text-muted">Loading concerts…</p>
      )}

      {concerts?.length === 0 && (
        <p className="mt-6 text-muted">No concerts available yet.</p>
      )}

      <div className="mt-8 flex flex-col gap-6">
        {concerts?.map((concert) => (
          <ConcertCard
            key={concert.id}
            concert={concert}
            pending={pendingId === concert.id}
            onReserve={() => handleReserve(concert)}
            onCancel={() => handleCancel(concert)}
          />
        ))}
      </div>
    </AppShell>
  );
}

function ConcertCard({
  concert,
  pending,
  onReserve,
  onCancel,
}: {
  concert: Concert;
  pending: boolean;
  onReserve: () => void;
  onCancel: () => void;
}) {
  const reserved = concert.isReservedByCurrentUser && concert.reservationId;
  const soldOut = concert.availableSeats <= 0;

  return (
    <article className="rounded-md bg-surface p-8 shadow-raised sm:p-10">
      <h2 className="text-2xl font-semibold text-secondary sm:text-[32px]">
        {concert.name}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-on-surface/80">
        {concert.description}
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-muted">
          <SeatIcon />
          <span className="text-base">{seats.format(concert.totalSeats)}</span>
        </span>

        {/* State precedence: reserved-by-me wins over sold-out. */}
        {reserved ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="w-full rounded-sm bg-tertiary px-8 py-3 font-medium text-white transition hover:bg-tertiary/90 disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Canceling…" : "Cancel"}
          </button>
        ) : soldOut ? (
          <button
            type="button"
            disabled
            className="w-full rounded-sm bg-border px-8 py-3 font-medium text-white sm:w-auto"
          >
            Sold Out
          </button>
        ) : (
          <button
            type="button"
            onClick={onReserve}
            disabled={pending}
            className="w-full rounded-sm bg-secondary px-8 py-3 font-medium text-white transition hover:bg-secondary/90 disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Reserving…" : "Reserve"}
          </button>
        )}
      </div>
    </article>
  );
}

function SeatIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}
