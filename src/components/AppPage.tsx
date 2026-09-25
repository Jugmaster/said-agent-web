import type { ReactNode } from "react";

/**
 * The one page shell every signed-in screen uses: a main column that fills
 * the canvas and an optional right rail on wide screens (inline below the
 * content on narrow ones), the same header, the same paddings. Home and
 * Wallet set this shape; everything else follows it.
 */
export default function AppPage({
  title,
  sub,
  actions,
  rail,
  children,
  narrow = false,
}: {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  rail?: ReactNode;
  children: ReactNode;
  /** Reading-width main column (settings, forms) instead of the full canvas. */
  narrow?: boolean;
}) {
  return (
    <div className="flex min-h-dvh">
      <div className="min-w-0 flex-1 overflow-y-auto px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(var(--tabbar-h)+1.5rem)] md:px-8 md:pt-10 md:pb-12">
        <div className={narrow ? "max-w-3xl" : ""}>
          <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
              {sub && <p className="mt-1 max-w-[60ch] text-sm text-grey">{sub}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </header>
          {children}
          {rail && <div className="mt-9 space-y-6 xl:hidden">{rail}</div>}
        </div>
      </div>
      {rail && <aside className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-line p-5 pt-10 xl:flex">{rail}</aside>}
    </div>
  );
}

/** A labelled block inside a page: the eyebrow and its content. */
export function PageSection({ label, action, children, className = "" }: { label: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-grey">{label}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** The card. One radius, one border, one fill, everywhere. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-card p-4 ${className}`}>{children}</div>;
}
