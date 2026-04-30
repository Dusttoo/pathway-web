import { redirect } from "next/navigation";

export default function FeatsIndexPage() {
  redirect("/library?tab=feats");
}
