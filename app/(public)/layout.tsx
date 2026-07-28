import React from 'react'
import Footer from '../components/Shared/Footer/Footer'
import Navbar from '../components/Shared/Navbar/Navbar'

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
