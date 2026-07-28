"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  LoaderCircleIcon,
} from "lucide-react"

import AuthShell from "../AuthShell/AuthShell"
import { useAuthToast } from "../Toast/AuthToast"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEMO_ACCOUNTS = [
  {
    name: "Ayesha Siddika",
    initials: "AS",
    role: "Customer",
    email: "ayesha@mail.com",
    href: "/bookings",
  },
  {
    name: "Shamim Ahmed",
    initials: "SA",
    role: "Technician",
    email: "shamim@mail.com",
    href: "/technicians",
  },
  {
    name: "Platform admin",
    initials: "PA",
    role: "Admin",
    email: "admin@fixitnow.bd",
    href: "/",
  },
] as const

type FieldErrors = {
  email?: string
  password?: string
}

function validateEmail(value: string) {
  if (!value.trim()) return "Enter the email you signed up with."
  if (!EMAIL_RE.test(value.trim())) return "That email address looks incomplete."
  return ""
}

function validatePassword(value: string) {
  if (!value) return "Enter your password."
  if (value.length < 8) return "Passwords are at least 8 characters."
  return ""
}

function LoginAside() {
  return (
    <>
      <p className="auth-eyebrow">Welcome back</p>
      <h2 className="auth-display-lg">
        Your jobs are
        <br />
        where you left them.
      </h2>
      <p className="auth-lede">
        Bookings, payments and reviews all live in one dashboard — shaped by
        whichever role you signed up with.
      </p>

      <blockquote className="auth-quote">
        <p>
          “Two other electricians gave up on the fault. Shamim found it in
          twenty minutes and told me what caused it.”
        </p>
        <cite>Mahmudul Hasan · Mohammadpur</cite>
      </blockquote>

      <div className="auth-stats">
        <div>
          <b>18,400+</b>
          <span>Jobs completed</span>
        </div>
        <div>
          <b>312</b>
          <span>Verified techs</span>
        </div>
      </div>
    </>
  )
}

function LoginForm() {
  const router = useRouter()
  const { pushToast } = useAuthToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  const setFieldError = (field: keyof FieldErrors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message || undefined }))
  }

  const validateAll = () => {
    const next: FieldErrors = {
      email: validateEmail(email) || undefined,
      password: validatePassword(password) || undefined,
    }
    setErrors(next)
    return Object.values(next).filter(Boolean).length
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    const count = validateAll()
    if (count > 0) {
      pushToast({
        kind: "error",
        title: "Check the form",
        message: "Two fields still need attention.",
      })
      return
    }

    setLoading(true)
    window.setTimeout(() => {
      pushToast({
        kind: "success",
        title: "Logged in",
        message: "Welcome back. Opening your dashboard.",
      })
      window.setTimeout(() => {
        router.push("/bookings")
      }, 800)
    }, 1100)
  }

  const handleDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    if (loading) return
    setEmail(account.email)
    setPassword("demo1234")
    setErrors({})
    pushToast({
      kind: "success",
      title: `Signing in as ${account.role}`,
      message: account.name,
    })
    window.setTimeout(() => {
      router.push(account.href)
    }, 900)
  }

  return (
    <>
      <p className="auth-eyebrow auth-eyebrow--light">Sign in</p>
      <h1 className="auth-display-md">
        Log in to{" "}
        <Link href="/" className="auth-brand-inline">
          Fix<span>It</span>Now
        </Link>
      </h1>
      <p className="auth-sub">
        New here? <Link href="/auth/register">Create an account</Link>
      </p>

      <form className="auth-fields" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="login-email">
            Email <span className="field__req">*</span>
          </label>
          <input
            id="login-email"
            className={`input${errors.email ? " is-error" : ""}`}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setFieldError("email", validateEmail(e.target.value))
            }}
            onBlur={() => setFieldError("email", validateEmail(email))}
          />
          {errors.email && (
            <p className="field__error">
              <AlertCircleIcon size={14} />
              {errors.email}
            </p>
          )}
        </div>

        <div className="field">
          <div className="field__label-row">
            <label className="field__label" htmlFor="login-password">
              Password <span className="field__req">*</span>
            </label>
            <Link className="field__forgot" href="/auth/forgot-password">
              Forgot?
            </Link>
          </div>
          <input
            id="login-password"
            className={`input${errors.password ? " is-error" : ""}`}
            type="password"
            autoComplete="current-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password)
                setFieldError("password", validatePassword(e.target.value))
            }}
            onBlur={() => setFieldError("password", validatePassword(password))}
          />
          {errors.password && (
            <p className="field__error">
              <AlertCircleIcon size={14} />
              {errors.password}
            </p>
          )}
        </div>

        <label className="field__check">
          <input
            type="checkbox"
            checked={keepSignedIn}
            onChange={(e) => setKeepSignedIn(e.target.checked)}
          />
          <span>Keep me signed in on this device</span>
        </label>

        <button className="btn-auth" type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircleIcon className="btn-auth__spin" />
              Signing in…
            </>
          ) : (
            "Log in"
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>or try a demo role</span>
      </div>

      {DEMO_ACCOUNTS.map((account) => (
        <button
          key={account.email}
          type="button"
          className="demo-acc"
          onClick={() => handleDemo(account)}
        >
          <span className="demo-acc__avatar">{account.initials}</span>
          <span>
            <span className="demo-acc__name">{account.name}</span>
            <span className="demo-acc__meta">
              {account.role} · {account.email}
            </span>
          </span>
          <ArrowRightIcon className="demo-acc__arrow size-4" />
        </button>
      ))}
    </>
  )
}

export default function LoginPageView() {
  return (
    <AuthShell aside={<LoginAside />}>
      <LoginForm />
    </AuthShell>
  )
}
