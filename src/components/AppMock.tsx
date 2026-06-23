"use client";

// A stylized mock of the Yemame OPOS desktop window — a left nav + a sell screen
// with a cart and totals. Purely decorative; mirrors the desktop app's teal look.

import { Banknote, BarChart3, Boxes, LayoutGrid, Receipt, Search, Settings } from "lucide-react";

const NAV = [
  { icon: LayoutGrid, label: "Dashboard" },
  { icon: Receipt, label: "Sell", active: true },
  { icon: Boxes, label: "Products" },
  { icon: BarChart3, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

const CART = [
  { name: "Indomie Chicken", qty: 3, price: "₵7.50" },
  { name: "Voltic Water 750ml", qty: 2, price: "₵5.00" },
  { name: "Milo Sachet", qty: 5, price: "₵12.50" },
];

const GRID = [
  { name: "Bread", tone: "bg-amber-50 text-amber-700" },
  { name: "Eggs", tone: "bg-teal-50 text-teal-700" },
  { name: "Rice 5kg", tone: "bg-rose-50 text-rose-700" },
  { name: "Sugar", tone: "bg-sky-50 text-sky-700" },
  { name: "Oil 1L", tone: "bg-violet-50 text-violet-700" },
  { name: "Soap", tone: "bg-lime-50 text-lime-700" },
];

export function AppMock() {
  return (
    <div className="w-full max-w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#f5faf9] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs font-medium text-ink/40">Yemame OPOS — Sell</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
          ● Offline
        </span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-36 shrink-0 flex-col gap-1 border-r border-black/[0.06] bg-[#fbfdfc] p-3 sm:flex">
          <div className="mb-2 px-2 text-[11px] font-bold tracking-tight">
            Yemame <span className="text-teal-600">OPOS</span>
          </div>
          {NAV.map((n) => (
            <div
              key={n.label}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium ${
                n.active ? "bg-teal-500/10 text-teal-700" : "text-ink/55"
              }`}
            >
              <n.icon className="h-3.5 w-3.5" />
              {n.label}
            </div>
          ))}
        </aside>

        {/* Main */}
        <div className="flex-1 p-4">
          {/* Search */}
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-3 py-2 text-xs text-ink/40">
            <Search className="h-3.5 w-3.5" /> Scan or search a product…
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {/* Product grid */}
            <div className="grid grid-cols-3 gap-2 sm:col-span-3">
              {GRID.map((g) => (
                <div
                  key={g.name}
                  className={`flex h-16 flex-col justify-end rounded-xl p-2 text-[11px] font-semibold ${g.tone}`}
                >
                  {g.name}
                </div>
              ))}
            </div>

            {/* Cart */}
            <div className="flex flex-col rounded-xl border border-black/[0.07] bg-white p-3 sm:col-span-2">
              <p className="mb-2 text-[11px] font-bold text-ink/60">Current sale</p>
              <div className="space-y-1.5">
                {CART.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-[11px]">
                    <span className="truncate text-ink/70">
                      <span className="text-teal-600">{c.qty}×</span> {c.name}
                    </span>
                    <span className="font-semibold">{c.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-dashed border-black/10 pt-2">
                <div className="flex items-center justify-between text-[11px] text-ink/50">
                  <span>Subtotal</span><span>₵25.00</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-ink/70">Total</span>
                  <span className="text-base font-extrabold text-teal-700">₵25.00</span>
                </div>
              </div>
              <button className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-teal-500 py-2 text-[12px] font-bold text-white">
                <Banknote className="h-3.5 w-3.5" /> Charge ₵25.00
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
