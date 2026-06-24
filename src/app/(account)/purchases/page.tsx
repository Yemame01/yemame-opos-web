"use client";

import { Receipt, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePayments } from "@/lib/useAccount";
import { formatMoneyMinor } from "@/lib/types";
import {
  PageHeader,
  EmptyState,
  StatusBadge,
  fmtTs,
} from "@/components/account/ui";

export default function PurchasesPage() {
  const { payments, loading } = usePayments();

  const totalSpent = payments
    .filter((p) => p.status === "success")
    .reduce((s, p) => s + (p.amountMinor || 0), 0);

  return (
    <>
      <PageHeader
        title="Purchases"
        subtitle="Your payment history. Each purchase creates an activation key."
        action={
          <Link href="/buy" className="btn-primary">
            <ShoppingCart className="h-4 w-4" /> Buy keys
          </Link>
        }
      />

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl border border-black/[0.06] bg-white" />
      ) : payments.length === 0 ? (
        <EmptyState
          Icon={Receipt}
          title="No purchases yet"
          body="When you buy a key, the receipt shows up here with its reference and amount."
          cta={{ label: "Buy your first key", href: "/buy" }}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-ink/55">
            Total spent:{" "}
            <span className="font-semibold text-ink">
              {formatMoneyMinor(totalSpent)}
            </span>{" "}
            across {payments.length} purchase{payments.length === 1 ? "" : "s"}.
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-black/[0.06] bg-white sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] text-left text-xs uppercase tracking-wider text-ink/45">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-black/[0.04] last:border-0"
                  >
                    <td className="px-5 py-3.5">{fmtTs(p.paidAt)}</td>
                    <td className="px-5 py-3.5 font-semibold">
                      {formatMoneyMinor(p.amountMinor, p.currency)}
                    </td>
                    <td className="px-5 py-3.5 capitalize text-ink/60">
                      {p.channel || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-ink/45">
                      {p.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {payments.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-black/[0.06] bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {formatMoneyMinor(p.amountMinor, p.currency)}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-sm text-ink/55">
                  {fmtTs(p.paidAt)} · {p.channel || "—"}
                </p>
                <p className="mt-1 font-mono text-xs text-ink/40">{p.reference}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
