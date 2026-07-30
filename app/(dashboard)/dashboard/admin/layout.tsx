import AuthGuard from "@/app/providers/AuthGuard"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AuthGuard roles={["ADMIN"]}>{children}</AuthGuard>
}
