import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to buy and manage your Yemame OPOS licenses.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
