import Link from "next/link";
import { Brand } from "./Brand";

const YEAR = 2026; // bumped on release; avoids hydration mismatch from new Date()

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-black/[0.06] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Brand size={26} />
            <p className="mt-3 max-w-xs text-sm text-ink/55">
              The offline point of sale for shops that need to keep selling — with
              or without internet.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-ink">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink/60">
              <li><Link href="/#features" className="hover:text-teal-600">Features</Link></li>
              <li><Link href="/#packages" className="hover:text-teal-600">Pricing</Link></li>
              <li><Link href="/buy" className="hover:text-teal-600">Get a license</Link></li>
              <li><Link href="/dashboard" className="hover:text-teal-600">My licenses</Link></li>
            </ul>
          </div>

          {/* Other Yemame products */}
          <div>
            <h4 className="text-sm font-semibold text-ink">More from Yemame</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink/60">
              <li><a href="https://pos.yemame.com" className="hover:text-teal-600">Yemame POS (cloud)</a></li>
              <li><a href="https://serve.yemame.com" className="hover:text-teal-600">Yemame Serve</a></li>
              <li><a href="https://reserve.yemame.com" className="hover:text-teal-600">Yemame Reserve</a></li>
              <li><a href="https://www.yemame.com" className="hover:text-teal-600">Yemame.com</a></li>
            </ul>
          </div>

          {/* Company / legal */}
          <div>
            <h4 className="text-sm font-semibold text-ink">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink/60">
              <li><a href="https://www.yemame.com/blog" className="hover:text-teal-600">Blog</a></li>
              <li><Link href="/terms" className="hover:text-teal-600">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-teal-600">Privacy Policy</Link></li>
              <li><a href="https://wa.me/233559760063" className="hover:text-teal-600">Support (WhatsApp)</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-black/[0.06] pt-6 text-sm text-ink/50 sm:flex-row">
          <p>© {YEAR} Yemame. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Only buy activation keys directly from Yemame —{" "}
            <Link href="/terms" className="font-medium text-teal-600">
              see why
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
