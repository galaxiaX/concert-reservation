import type { ReactNode } from "react";

const SUPPORTING_COPY =
  "Lorem ipsum dolor sit amet consectetur. Elit purus nam gravida porttitor nibh urna sit ornare a. Proin dolor morbi id ornare aenean non.";

/**
 * Split-screen auth layout (Figma: 720/720). Left brand panel is shown from
 * `lg` up; the form column fills the width on smaller screens.
 */
export function AuthShell({
  tagline,
  children,
}: {
  tagline: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-brand p-12 text-white lg:flex xl:p-16">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-white" aria-hidden />
          <span className="text-2xl font-bold tracking-wide">BRAND</span>
        </div>
        <div className="max-w-md">
          <p className="text-[32px] font-bold leading-tight">{tagline}</p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {SUPPORTING_COPY}
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-[100px]">
        <div className="w-full max-w-[460px]">
          <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
            <span className="h-8 w-8 rounded-full bg-brand" aria-hidden />
            <span className="text-xl font-bold tracking-wide text-brand">
              BRAND
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
