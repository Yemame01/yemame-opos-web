import { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/** Shared chrome + typography for legal pages (Terms, Privacy). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: {updated}</p>
        <div className="legal mt-8 space-y-6 text-ink/75">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** A legal section with a heading. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h2 className="text-lg font-semibold text-ink">{heading}</h2>
      {children}
    </section>
  );
}
