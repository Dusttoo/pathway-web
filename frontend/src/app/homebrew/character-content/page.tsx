import { redirect } from "next/navigation";

// This page has been merged into the main /homebrew page.
// The ancestry/class/background tabs live at /homebrew?tab=ancestry etc.
export default function HomebrewCharacterContentRedirect() {
  redirect("/homebrew?tab=ancestry");
}
