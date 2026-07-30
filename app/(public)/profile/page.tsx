import type { Metadata } from "next"

import ProfilePageView from "@/app/components/Profile/ProfilePage"

export const metadata: Metadata = {
  title: "My profile — FixItNow",
  description: "View and update your FixItNow account details.",
}

export default function ProfilePage() {
  return <ProfilePageView />
}
