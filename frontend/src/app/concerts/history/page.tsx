"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ApiError, reservationsApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { MyReservation } from "@/lib/types";

const dt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function UserHistoryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<MyReservation[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await reservationsApi.mine());
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to load history.",
      );
    }
  }, []);

  // localStorage is client-only — guard and fetch after mount.
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login?as=user");
      return;
    }
    void load();
  }, [router, load]);

  return (
    <AppShell role="USER" active="history">
      <h1 className="text-[32px] font-semibold sm:text-[40px]">
        My reservations
      </h1>
      <p className="mt-2 text-muted">Your reservation history, newest first.</p>

      {loadError && (
        <p className="mt-6 text-error" role="alert">
          {loadError}
        </p>
      )}

      {rows === null && !loadError && (
        <p className="mt-6 text-muted">Loading history…</p>
      )}

      {rows?.length === 0 && (
        <p className="mt-6 text-muted">You have no reservations yet.</p>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-base">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-6 py-4 font-medium">Concert</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Reserved date</th>
                <th className="px-6 py-4 font-medium">Canceled date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-6 py-4">{row.concertName}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-6 py-4 text-muted tabular-nums">
                    {dt.format(new Date(row.reservedAt))}
                  </td>
                  <td className="px-6 py-4 text-muted tabular-nums">
                    {row.canceledAt ? dt.format(new Date(row.canceledAt)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function StatusBadge({ status }: { status: MyReservation["status"] }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-block rounded-full px-2 py-1 text-sm font-medium ${
        active ? "bg-teal/10 text-teal" : "bg-tertiary/10 text-tertiary"
      }`}
    >
      {active ? "Active" : "Canceled"}
    </span>
  );
}
