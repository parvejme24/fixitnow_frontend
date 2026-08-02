export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col bg-[#F7F9FB]">
      {children}
    </div>
  )
}
