import { redirect } from "next/navigation";

export default function LegacyAppearanceSettingsPage() {
  redirect("/settings/general");
}
