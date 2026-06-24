import { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import DownloadClient from "./DownloadClient";

export const metadata: Metadata = {
  title: "Download — Windows & macOS installers",
  description:
    "Download Yemame OPOS for Windows and macOS. See every version, what's new, fixes and improvements. Install once, activate with your key, and sell offline.",
  alternates: { canonical: "https://opos.yemame.com/download" },
  openGraph: {
    title: "Download Yemame OPOS — Windows & macOS",
    description:
      "Get the offline point of sale for your desktop. Latest installers plus the full version history.",
    url: "https://opos.yemame.com/download",
  },
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <DownloadClient />
      <SiteFooter />
    </div>
  );
}
