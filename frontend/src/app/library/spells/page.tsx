import { redirect } from "next/navigation";

export default function SpellsIndexPage() {
  redirect("/library?tab=spells");
}
