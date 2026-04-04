import { redirect } from "next/navigation";

export default function LegacyDataPrivacySettingsPage() {
  redirect("/settings/general");
}
