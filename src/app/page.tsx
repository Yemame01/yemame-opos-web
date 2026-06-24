"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  Download,
  Lock,
  Receipt,
  ShieldCheck,
  Sparkles,
  Wallet,
  WifiOff,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AppMock } from "@/components/AppMock";
import {
  Reveal,
  Stagger,
  StaggerItem,
  CountUp,
  motion,
  useReducedMotion,
} from "@/components/motion";
import { useScroll, useTransform } from "framer-motion";
import { usePackages } from "@/lib/usePackages";
import { formatMoneyMinor } from "@/lib/types";

const BUSINESS_TYPES = [
  { icon: "🛒", name: "Provision shops" },
  { icon: "💊", name: "Pharmacies" },
  { icon: "👗", name: "Boutiques" },
  { icon: "📱", name: "Phone & gadgets" },
  { icon: "🧴", name: "Cosmetics" },
  { icon: "🍞", name: "Mini-marts" },
];

const FEATURES = [
  { icon: WifiOff, title: "Works 100% offline", body: "Sell, search, and print with zero internet. Your data lives on the device — not the cloud." },
  { icon: Zap, title: "Lightning checkout", body: "Barcode-scanner friendly and keyboard-first. Built for a busy counter and long queues." },
  { icon: Boxes, title: "Stock & inventory", body: "Products, low-stock alerts, purchases, and adjustments — tracked locally, always accurate." },
  { icon: Receipt, title: "Receipts & printing", body: "Thermal 80mm and A4 receipts with your shop's logo, totals, and change." },
  { icon: BarChart3, title: "Live reports", body: "Daily sales, best sellers, payment mix, and profit — computed instantly on your machine." },
  { icon: Lock, title: "Staff PINs & roles", body: "Each team member signs in with a PIN; permissions control exactly what they can do." },
];

const STEPS = [
  { n: "1", title: "Buy a license", body: "Pick a package and pay securely. Your activation key is issued instantly." },
  { n: "2", title: "Download & install", body: "Get Yemame OPOS for macOS or Windows and install it on your computer." },
  { n: "3", title: "Activate once", body: "Enter your purchase email + key on first run. After that, it runs offline forever." },
];

const OTHER_PRODUCTS = [
  {
    logo: "/pos-logo.png",
    name: "Yemame POS",
    tag: "Cloud retail POS",
    body: "Run multiple shops from one online dashboard — sales, stock, staff, customers and reports, with SMS receipts.",
    href: "https://pos.yemame.com",
    glow: "bg-sky-500/15",
    chips: ["Multi-shop", "Online dashboard", "SMS"],
  },
  {
    logo: "/serve-logo.png",
    name: "Yemame Serve",
    tag: "Order & loyalty app",
    body: "Let customers browse your menu and order from their phones, with loyalty rewards built in for restaurants and food joints.",
    href: "https://serve.yemame.com",
    glow: "bg-amber-500/15",
    chips: ["Mobile ordering", "Loyalty", "Kitchen queue"],
  },
  {
    logo: "/reserve-logo.png",
    name: "Yemame Reserve",
    tag: "Bookings & scheduling",
    body: "Take reservations 24/7 for salons, spas, clinics and studios — with reminders that cut no-shows.",
    href: "https://reserve.yemame.com",
    glow: "bg-rose-500/15",
    chips: ["24/7 booking", "Reminders", "Staff calendars"],
  },
];

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Subtle parallax on the app mock as you scroll the hero.
  const mockY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const mockRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -2]);

  return (
    <section ref={ref} className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6">
      {/* gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-10 top-10 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left: copy */}
        <div className="min-w-0">
          <motion.span
            className="eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <WifiOff className="h-4 w-4" /> No internet required
          </motion.span>

          <motion.h1
            className="mt-6 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            Sell offline.
            <br />
            <span className="text-teal-600">Never miss a sale.</span>
          </motion.h1>

          <motion.p
            className="mt-5 max-w-xl text-lg leading-relaxed text-ink/60"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            When the network drops, your shop shouldn&apos;t. Yemame OPOS runs
            entirely on your computer — ring up sales, track stock and print
            receipts with zero internet. Pay once, own it for good. No data, no
            downtime, no monthly bills.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <Link href="/signup" className="cta-primary group">
              Get a license
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#how" className="cta-secondary">How it works</a>
          </motion.div>

          {/* trust strip */}
          <motion.div
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-black/10 pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-teal-600" />
              <div>
                <p className="text-sm font-semibold text-ink">Pay once</p>
                <p className="text-xs text-ink/55">No subscriptions</p>
              </div>
            </div>
            <div className="h-8 w-px bg-black/10" />
            <div className="flex items-center gap-3">
              <Wallet className="h-7 w-7 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-ink">Mobile Money & cash</p>
                <p className="text-xs text-ink/55">Cedis-ready</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: app mock with parallax + floating cards */}
        <motion.div
          className="relative min-w-0"
          style={{ y: mockY, rotate: mockRotate }}
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <AppMock />

          {/* floating "Sale recorded" card */}
          <motion.div
            className="absolute -right-4 -top-5 hidden rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xl sm:block"
            animate={reduce ? {} : { y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50">
                <Check className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Sale recorded</p>
                <p className="text-xs text-ink/55">₵25.00 · cash</p>
              </div>
            </div>
          </motion.div>

          {/* floating "offline" pill */}
          <motion.div
            className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-xl sm:block"
            animate={reduce ? {} : { y: [0, 8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                <WifiOff className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">No internet?</p>
                <p className="text-xs text-ink/55">Still selling.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const { packages, loading } = usePackages();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />

      {/* ─── Business types ─── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="text-center">
            <span className="eyebrow">PERFECT FOR</span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Built for shops like yours
            </h2>
          </Reveal>
          <Stagger className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {BUSINESS_TYPES.map((b) => (
              <StaggerItem key={b.name}>
                <div className="group flex flex-col items-center rounded-2xl border border-transparent bg-[#f7faf9] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-black/[0.06] hover:bg-white hover:shadow-xl">
                  <span className="text-3xl transition-transform group-hover:scale-110">{b.icon}</span>
                  <span className="mt-3 text-center text-sm font-semibold text-ink">{b.name}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="bg-[#f7faf9] py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="text-center">
            <h2 className="text-4xl font-bold sm:text-5xl">Everything a shop needs</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-ink/60">
              A full point of sale — not a stripped-down offline mode. Built for
              real counters.
            </p>
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <StaggerItem key={f.title}>
                <div className="group h-full rounded-2xl border border-black/[0.05] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 transition-transform group-hover:scale-110">
                    <f.icon className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">{f.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── Stats band ─── */}
      <section className="bg-teal-600 py-16 text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 text-center md:grid-cols-4">
          {[
            { v: 100, suffix: "%", label: "Runs offline" },
            { v: 0, prefix: "₵", label: "Monthly fees" },
            { v: 2, label: "Mac & Windows" },
            { v: 1, suffix: "×", label: "Activate, then forever" },
          ].map((s) => (
            <Reveal key={s.label}>
              <p className="text-4xl font-extrabold tabular-nums sm:text-5xl">
                <CountUp to={s.v} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-sm text-teal-50/80">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="text-center">
            <span className="eyebrow">GET STARTED</span>
            <h2 className="mt-4 text-4xl font-bold sm:text-5xl">Up and running in minutes</h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <StaggerItem key={s.n}>
                <div className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-xl font-extrabold text-white shadow-lg shadow-teal-600/25">
                    {s.n}
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink/60">{s.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="mt-12 flex justify-center" delay={0.1}>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              <ShieldCheck className="h-4 w-4" />
              Buy keys only from Yemame — third-party keys won&apos;t activate.
            </span>
          </Reveal>
        </div>
      </section>

      {/* ─── Packages ─── */}
      <section id="packages" className="bg-[#f7faf9] py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="text-center">
            <span className="eyebrow">PRICING</span>
            <h2 className="mt-4 text-4xl font-bold sm:text-5xl">Choose a package</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-ink/60">
              Each license activates the app on your device. More activations =
              more installs. Reinstalling on the same computer is always free.
            </p>
          </Reveal>

          {loading ? (
            <p className="mt-12 text-center text-ink/50">Loading packages…</p>
          ) : packages.length === 0 ? (
            <p className="mt-12 text-center text-ink/50">
              Packages are being set up. Please check back shortly.
            </p>
          ) : (
            <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {packages.map((p, i) => {
                const featured = i === 1;
                return (
                  <StaggerItem key={p.id}>
                    <div
                      className={`flex h-full flex-col rounded-2xl bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                        featured
                          ? "ring-2 ring-teal-500 shadow-xl"
                          : "border border-black/[0.06] shadow-sm"
                      }`}
                    >
                      {featured && (
                        <span className="mb-3 w-fit rounded-full bg-teal-500 px-3 py-1 text-xs font-bold text-white">
                          Most popular
                        </span>
                      )}
                      <h3 className="text-lg font-bold">{p.name}</h3>
                      <p className="mt-2 text-4xl font-extrabold text-teal-600">
                        {p.activations}
                        <span className="ml-1 text-base font-medium text-ink/45">
                          activation{p.activations === 1 ? "" : "s"}
                        </span>
                      </p>
                      <p className="mt-3 text-2xl font-bold">
                        {p.priceMinor > 0 ? formatMoneyMinor(p.priceMinor, p.currency) : "—"}
                      </p>
                      <ul className="mt-5 flex-1 space-y-2 text-sm text-ink/70">
                        <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-teal-500" /> Full offline POS</li>
                        <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-teal-500" /> Free updates</li>
                        <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-teal-500" /> Same-device reinstall free</li>
                      </ul>
                      <Link
                        href="/signup"
                        className={`mt-6 ${featured ? "cta-primary" : "btn-primary !rounded-full"} w-full`}
                      >
                        Buy
                      </Link>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </div>
      </section>

      {/* ─── Cross-promote: the Yemame suite (dark, stylish) ─── */}
      <section className="relative overflow-hidden bg-ink py-24">
        {/* ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5">
          <Reveal className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-teal-300">
              <Sparkles className="h-4 w-4" /> MORE FROM YEMAME
            </span>
            <h2 className="mt-5 text-3xl font-bold text-white sm:text-4xl">
              One toolkit for every kind of business
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/55">
              OPOS keeps your counter running offline. When you need the cloud,
              mobile ordering, or bookings — there&apos;s a Yemame app for that.
            </p>
          </Reveal>

          <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
            {OTHER_PRODUCTS.map((p) => (
              <StaggerItem key={p.name}>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/[0.07]"
                >
                  {/* per-product glow on hover */}
                  <div
                    className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full ${p.glow} blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="relative flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
                      <Image src={p.logo} alt={p.name} width={36} height={36} className="object-contain" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{p.name}</h3>
                      <p className="text-xs font-medium text-white/45">{p.tag}</p>
                    </div>
                  </div>
                  <p className="relative mt-4 flex-1 text-sm leading-relaxed text-white/60">
                    {p.body}
                  </p>
                  <div className="relative mt-4 flex flex-wrap gap-1.5">
                    {p.chips.map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300">
                    Explore {p.name.replace("Yemame ", "")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="px-5 py-24">
        <Reveal>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-600 to-teal-700 px-8 py-16 text-center text-white">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
            <Download className="mx-auto h-11 w-11 opacity-90" />
            <h2 className="mt-4 text-4xl font-extrabold sm:text-5xl">Start selling offline today</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-teal-50/90">
              Get your license, install on your computer, and you&apos;re ready —
              no internet, no monthly fees.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="rounded-full bg-white px-7 py-3.5 font-bold text-teal-700 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-teal-50">
                Get a license
              </Link>
              <Link href="/download" className="rounded-full border-2 border-white/40 px-7 py-3.5 font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10">
                Download the app
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
