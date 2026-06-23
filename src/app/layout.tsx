import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/useAuth";

const SITE_URL = "https://opos.yemame.com";
const TITLE = "Yemame OPOS — Offline Point of Sale for Shops";
const DESCRIPTION =
  "Yemame OPOS is a fully offline desktop point of sale for macOS & Windows. Sell, track stock, and print receipts with no internet. Buy a license, activate once, and keep selling — no monthly fees.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Yemame OPOS",
  },
  description: DESCRIPTION,
  applicationName: "Yemame OPOS",
  keywords: [
    "offline POS",
    "offline point of sale",
    "POS without internet",
    "desktop POS Ghana",
    "POS software Ghana",
    "Windows POS",
    "Mac POS",
    "retail POS offline",
    "inventory software offline",
    "shop point of sale",
    "Yemame",
    "Yemame OPOS",
    "Yemame offline POS",
  ],
  authors: [{ name: "Yemame", url: "https://www.yemame.com" }],
  creator: "Yemame",
  publisher: "Yemame",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Yemame OPOS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "A fully offline desktop point of sale for shops — sell with or without internet. Buy a license, activate once, no monthly fees.",
    creator: "@yemamehq",
    site: "@yemamehq",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: SITE_URL },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  category: "Technology",
};

export const viewport: Viewport = {
  themeColor: "#05696B",
  width: "device-width",
  initialScale: 1,
};

// Structured data for rich search results.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "Yemame",
      url: "https://www.yemame.com",
      logo: `${SITE_URL}/icon-512.png`,
      sameAs: [
        "https://www.tiktok.com/@yemamehq",
        "https://www.instagram.com/yemamehq",
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "Yemame OPOS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "macOS, Windows",
      description: DESCRIPTION,
      url: SITE_URL,
      offers: {
        "@type": "Offer",
        priceCurrency: "GHS",
        // Concrete prices live in the store; advertise availability only.
        availability: "https://schema.org/InStock",
      },
      publisher: { "@id": `${SITE_URL}/#org` },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
