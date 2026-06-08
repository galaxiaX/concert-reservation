import Link from "next/link";

/**
 * Landing / "Select Access Level" screen (Figma: Admin / Access Level frame).
 * Two entry cards link to the shared login form with an access-level hint —
 * the choice is cosmetic (button label only); routing is always by the
 * server-returned role. See datawow_vault/09-screens/Login.md.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral">
      <header className="flex items-center gap-3 bg-surface px-6 py-5 sm:px-12">
        <span className="h-7 w-7 rounded-full bg-brand" aria-hidden />
        <span className="text-xl font-bold tracking-wide text-brand">BRAND</span>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-[980px]">
          <h1 className="text-center text-[32px] font-semibold sm:text-[40px]">
            Select Access Level
          </h1>
          <p className="mt-3 text-center text-base text-muted">
            Choose how you want to enter the concert reservation portal.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <AccessCard
              variant="user"
              title="User"
              description="Browse available concerts and reserve a free seat."
              icon={<UserCardIcon />}
              ctaLabel="Enter Workspace"
              href="/login?as=user"
            />
            <AccessCard
              variant="admin"
              title="Administrator"
              description="Create and remove concerts and review the reservation log."
              icon={<AdminCardIcon />}
              ctaLabel="Enter Portal"
              href="/login?as=admin"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function AccessCard({
  variant,
  title,
  description,
  icon,
  ctaLabel,
  href,
}: {
  variant: "user" | "admin";
  title: string;
  description: string;
  icon: React.ReactNode;
  ctaLabel: string;
  href: string;
}) {
  const isAdmin = variant === "admin";
  return (
    <div
      className={`flex flex-col rounded-md p-8 sm:p-10 ${
        isAdmin
          ? "bg-brand text-white"
          : "border border-border bg-surface text-brand"
      }`}
    >
      <span className={isAdmin ? "text-white" : "text-brand"}>{icon}</span>
      <h2 className="mt-6 text-2xl font-semibold">{title}</h2>
      <p
        className={`mt-3 text-base leading-relaxed ${
          isAdmin ? "text-white/80" : "text-brand/80"
        }`}
      >
        {description}
      </p>
      <Link
        href={href}
        className={`mt-8 flex items-center justify-center gap-2 rounded-sm py-3 text-base font-medium transition ${
          isAdmin
            ? "bg-white text-brand hover:bg-white/90"
            : "bg-brand text-white hover:bg-brand/90"
        }`}
      >
        {ctaLabel}
        <ArrowIcon />
      </Link>
    </div>
  );
}

function UserCardIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="11" r="2.5" />
      <path d="M5.5 17a3.5 3.5 0 0 1 7 0" />
      <path d="M15 10h4" />
      <path d="M15 14h4" />
    </svg>
  );
}

function AdminCardIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-1a6 6 0 0 1 9-5.2" />
      <circle cx="18" cy="17" r="3" />
      <path d="M18 13.5v1" />
      <path d="M18 19.5v1" />
      <path d="m15.4 15.5.9.5" />
      <path d="m19.7 18 .9.5" />
      <path d="m15.4 18.5.9-.5" />
      <path d="m19.7 16 .9-.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
