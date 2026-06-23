import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy a license",
  description: "Choose a Yemame OPOS package and get your activation key.",
  robots: { index: false, follow: false },
};

export default function BuyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
