"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ApiError, reservationsApi } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import type { AuditLogRow } from "@/lib/types";

const dt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function AdminReservationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AuditLogRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await reservationsApi.auditLog());
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to load audit trail.",
      );
    }
  }, []);

  // localStorage is client-only — guard token + ADMIN role after mount.
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login?as=admin");
      return;
    }
    if (getUser()?.role !== "ADMIN") {
      router.replace("/concerts");
      return;
    }
    void load();
  }, [router, load]);

  return (
    <AppShell role="ADMIN" active="history">
      <h1 className="text-[32px] font-semibold sm:text-[40px]">History</h1>
      <p className="mt-2 text-muted">
        Every reserve and cancel across all users, newest first.
      </p>

      {loadError && (
        <p className="mt-6 text-error" role="alert">
          {loadError}
        </p>
      )}

      {rows === null && !loadError && (
        <p className="mt-6 text-muted">Loading history…</p>
      )}

      {rows?.length === 0 && (
        <p className="mt-6 text-muted">No reservation activity yet.</p>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-base">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-6 py-4 font-medium">Date time</th>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">Concert name</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={`${row.datetime}-${row.action}-${i}`}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-6 py-4 text-muted tabular-nums">
                    {dt.format(new Date(row.datetime))}
                  </td>
                  <td className="px-6 py-4">{row.username}</td>
                  <td className="px-6 py-4">{row.concertName}</td>
                  <td
                    className={`px-6 py-4 font-medium ${
                      row.action === "Cancel" ? "text-tertiary" : "text-secondary"
                    }`}
                  >
                    {row.action}
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
