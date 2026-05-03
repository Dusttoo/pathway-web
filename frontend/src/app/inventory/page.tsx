import { redirect } from "next/navigation";

// The standalone inventory page has been replaced by the Bag tab on each
// character sheet. Redirect anyone with an old bookmark to their characters.
export default function InventoryPage() {
  redirect("/characters");
}
