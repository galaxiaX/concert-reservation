"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Toast, type ToastState } from "@/components/Toast";
import { DeleteConcertModal } from "@/components/admin/DeleteConcertModal";
import { ApiError, adminApi, concertsApi } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import type { AdminStats, Concert } from "@/lib/types";

const nf = new Intl.NumberFormat("en-US");

type Tab = "overview" | "create";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [concerts, setConcerts] = useState<Concert[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [toast, setToast] = useState<ToastState>(null);
  const [deleting, setDeleting] = useState<Concert | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([adminApi.stats(), concertsApi.list()]);
      setStats(s);
      setConcerts(c);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to load dashboard.",
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

  async function handleCreate(input: {
    name: string;
    description: string;
    totalSeats: number;
  }) {
    setPending(true);
    try {
      await concertsApi.create(input);
      setToast({ message: `Created “${input.name}”.`, kind: "success" });
      setTab("overview");
      await load();
      return true;
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : "Create failed.",
        kind: "error",
      });
      return false;
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setPending(true);
    try {
      await concertsApi.remove(deleting.id);
      setToast({ message: `Deleted “${deleting.name}”.`, kind: "success" });
      setDeleting(null);
      await load();
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : "Delete failed.",
        kind: "error",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell role="ADMIN" active="home">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total of seats"
          value={stats?.totalSeats}
          className="bg-brand"
          icon={<PersonIcon />}
        />
        <StatCard
          label="Reserve"
          value={stats?.reserved}
          className="bg-teal"
          icon={<AwardIcon />}
        />
        <StatCard
          label="Cancel"
          value={stats?.canceled}
          className="bg-tertiary"
          icon={<XCircleIcon />}
        />
      </div>

      {loadError && (
        <p className="mt-6 text-error" role="alert">
          {loadError}
        </p>
      )}

      <div
        className="mt-8 flex gap-8 border-b border-border"
        role="tablist"
        aria-label="Admin views"
      >
        <TabButton
          label="Overview"
          active={tab === "overview"}
          onClick={() => setTab("overview")}
        />
        <TabButton
          label="Create"
          active={tab === "create"}
          onClick={() => setTab("create")}
        />
      </div>

      {tab === "overview" ? (
        <div className="mt-8 flex flex-col gap-6">
          {concerts === null && !loadError && (
            <p className="text-muted">Loading concerts…</p>
          )}
          {concerts?.length === 0 && (
            <p className="text-muted">No concerts yet. Create one.</p>
          )}
          {concerts?.map((concert) => (
            <AdminConcertCard
              key={concert.id}
              concert={concert}
              onDelete={() => setDeleting(concert)}
            />
          ))}
        </div>
      ) : (
        <CreateConcertForm pending={pending} onCreate={handleCreate} />
      )}

      {deleting && (
        <DeleteConcertModal
          concertName={deleting.name}
          pending={pending}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  className,
  icon,
}: {
  label: string;
  value: number | undefined;
  className: string;
  icon: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-md px-4 py-6 text-white ${className}`}
    >
      {icon}
      <span className="mt-2 text-base">{label}</span>
      <span className="mt-2 text-5xl font-light tabular-nums sm:text-6xl">
        {value === undefined ? "—" : nf.format(value)}
      </span>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px border-b-2 pb-3 text-base font-medium transition ${
        active
          ? "border-secondary text-secondary"
          : "border-transparent text-muted hover:text-on-surface"
      }`}
    >
      {label}
    </button>
  );
}

function AdminConcertCard({
  concert,
  onDelete,
}: {
  concert: Concert;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-md border border-border bg-surface p-8 sm:p-10">
      <h2 className="text-2xl font-semibold text-secondary sm:text-[32px]">
        {concert.name}
      </h2>
      <hr className="my-4 border-border" />
      <p className="text-base leading-relaxed text-on-surface/80">
        {concert.description}
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-muted">
          <PersonIcon />
          <span className="text-base">{nf.format(concert.totalSeats)}</span>
        </span>

        <button
          type="button"
          onClick={onDelete}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-tertiary px-8 py-3 font-medium text-white transition hover:bg-tertiary/90 sm:w-[160px]"
        >
          <TrashIcon />
          Delete
        </button>
      </div>
    </article>
  );
}

function CreateConcertForm({
  pending,
  onCreate,
}: {
  pending: boolean;
  onCreate: (input: {
    name: string;
    description: string;
    totalSeats: number;
  }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const seats = Number(totalSeats);
    if (!name.trim() || !description.trim() || !totalSeats.trim()) {
      setError("All fields are required.");
      return;
    }
    if (!Number.isInteger(seats) || seats <= 0) {
      setError("Total of seat must be a positive whole number.");
      return;
    }
    setError(null);
    const ok = await onCreate({
      name: name.trim(),
      description: description.trim(),
      totalSeats: seats,
    });
    if (ok) {
      setName("");
      setTotalSeats("");
      setDescription("");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-md border border-border bg-surface p-8 sm:p-10"
    >
      <h2 className="text-2xl font-semibold text-secondary sm:text-[32px]">
        Create
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Concert Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Please input concert name"
            className="w-full rounded-sm border border-muted px-3 py-2.5 text-base placeholder:text-border focus:border-secondary focus:outline-none"
          />
        </Field>
        <Field label="Total of seat">
          <div className="relative">
            <input
              type="number"
              min={1}
              value={totalSeats}
              onChange={(e) => setTotalSeats(e.target.value)}
              placeholder="500"
              className="w-full rounded-sm border border-muted px-3 py-2.5 pr-10 text-base placeholder:text-border focus:border-secondary focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              <PersonIcon />
            </span>
          </div>
        </Field>
      </div>

      <div className="mt-6">
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please input description"
            rows={4}
            className="w-full resize-none rounded-sm border border-muted px-3 py-2.5 text-base placeholder:text-border focus:border-secondary focus:outline-none"
          />
        </Field>
      </div>

      {error && (
        <p className="mt-4 text-error" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-sm bg-secondary px-8 py-3 font-medium text-white transition hover:bg-secondary/90 disabled:opacity-60"
        >
          <SaveIcon />
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-medium text-on-surface">
        {label}
      </span>
      {children}
    </label>
  );
}

function PersonIcon() {
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

function AwardIcon() {
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
      <circle cx="12" cy="8" r="6" />
      <path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5" />
    </svg>
  );
}

function XCircleIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 3h11l3 3v15H5z" />
      <path d="M8 3v6h8V3M8 21v-7h8v7" />
    </svg>
  );
}
