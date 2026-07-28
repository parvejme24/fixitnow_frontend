"use client"

import Link from "next/link"
import { useState } from "react"
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react"

import AuthShell from "../AuthShell/AuthShell"
import { useAuthToast } from "../Toast/AuthToast"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(value: string) {
  if (!value.trim()) return "Enter the email you signed up with."
  if (!EMAIL_RE.test(value.trim())) return "That email address looks incomplete."
  return ""
}

function ForgotAside() {
  return (
    <>
      <p className="auth-eyebrow">Password reset</p>
      <h2 className="auth-display-lg">
        Locked out?
        <br />
        We can fix that.
      </h2>
      <p className="auth-lede">
        Enter the email on your FixItNow account. If it matches, we&apos;ll send
        a reset link so you can set a new password and get back to your jobs.
      </p>

      <div className="auth-stats">
        <div>
          <b>1 link</b>
          <span>Valid for 30 min</span>
        </div>
        <div>
          <b>SMS</b>
          <span>Backup on request</span>
        </div>
      </div>
    </>
  )
}

function ForgotForm() {
  const { pushToast } = useAuthToast()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    const message = validateEmail(email)
    if (message) {
      setError(message)
      pushToast({
        kind: "error",
        title: "Check the form",
        message: "We need a valid email to send the reset link.",
      })
      return
    }

    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setSent(true)
      pushToast({
        kind: "success",
        title: "Check your inbox",
        message: "If that email is registered, a reset link is on the way.",
      })
    }, 1100)
  }

  return (
    <>
      <p className="auth-eyebrow auth-eyebrow--light">Account recovery</p>
      <h1 className="auth-display-md">
        Forgot password ·{" "}
        <Link href="/" className="auth-brand-inline">
          Fix<span>It</span>Now
        </Link>
      </h1>
      <p className="auth-sub">
        Remembered it? <Link href="/auth/login">Back to log in</Link>
      </p>

      {sent ? (
        <div className="auth-fields">
          <p className="field__hint" style={{ fontSize: "0.94rem", color: "#4A5C6B" }}>
            We sent instructions to <strong>{email.trim()}</strong>. Open the
            link within 30 minutes. Didn&apos;t get it? Check spam, or try again
            with another address.
          </p>
          <button
            type="button"
            className="btn-auth"
            onClick={() => {
              setSent(false)
              setEmail("")
            }}
          >
            Use a different email
          </button>
          <p className="auth-sub" style={{ marginTop: 4 }}>
            <Link href="/auth/login">Return to log in</Link>
          </p>
        </div>
      ) : (
        <form className="auth-fields" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="forgot-email">
              Email <span className="field__req">*</span>
            </label>
            <input
              id="forgot-email"
              className={`input${error ? " is-error" : ""}`}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(validateEmail(e.target.value))
              }}
              onBlur={() => setError(validateEmail(email))}
            />
            <p className="field__hint">
              Use the same email you registered with on FixItNow.
            </p>
            {error && (
              <p className="field__error">
                <AlertCircleIcon size={14} />
                {error}
              </p>
            )}
          </div>

          <button className="btn-auth" type="submit" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircleIcon className="btn-auth__spin" />
                Sending link…
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>
      )}
    </>
  )
}

export default function ForgotPasswordPageView() {
  return (
    <AuthShell aside={<ForgotAside />}>
      <ForgotForm />
    </AuthShell>
  )
}
