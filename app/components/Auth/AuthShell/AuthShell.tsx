"use client"

import type { ReactNode } from "react"

import { AuthToastProvider, useReveal } from "../Toast/AuthToast"
import "../auth.css"

type AuthShellProps = {
  aside: ReactNode
  children: ReactNode
}

function AuthFormPanel({ children }: { children: ReactNode }) {
  const visible = useReveal()

  return (
    <div className="auth__form">
      <div
        className={`auth__form-inner ${visible ? "is-visible" : "is-revealing"}`}
      >
        {children}
      </div>
    </div>
  )
}

export default function AuthShell({ aside, children }: AuthShellProps) {
  return (
    <AuthToastProvider>
      <div className="auth">
        <aside className="auth__aside">{aside}</aside>
        <AuthFormPanel>{children}</AuthFormPanel>
      </div>
    </AuthToastProvider>
  )
}
