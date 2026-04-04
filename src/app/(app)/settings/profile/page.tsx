import { redirect } from "next/navigation";

export default function LegacyProfileSettingsPage() {
  redirect("/settings/general");
}
