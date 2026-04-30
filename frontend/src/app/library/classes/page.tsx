import { redirect } from "next/navigation";

export default function ClassesIndexPage() {
  redirect("/library?tab=classes");
}
