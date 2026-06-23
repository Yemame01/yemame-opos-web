import { redirect } from "next/navigation";

// The Yemame blog lives on the main marketing site. Anyone landing on
// opos.yemame.com/blog is sent there.
export default function BlogPage() {
  redirect("https://www.yemame.com/blog");
}
