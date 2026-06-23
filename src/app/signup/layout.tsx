import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create a Yemame OPOS account to buy a license and activate the offline POS on your computer.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
