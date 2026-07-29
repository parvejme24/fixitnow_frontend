"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react"

import { useAuth } from "@/app/providers/AuthProvider"
import { getAuthErrorMessage } from "@/lib/auth/errors"

import AuthShell from "../AuthShell/AuthShell"
import { useAuthToast } from "../Toast/AuthToast"

type FieldErrors = {
  password?: string
  confirm?: string
}

function validatePassword(value: string) {
  if (!value) return "Choose a new password."
  if (value.length < 8) return "Use at least 8 characters."
  if (!/\d/.test(value)) return "Include at least one number."
  return ""
}

function ResetAside() {
  return (
    <>
      <p className="auth-eyebrow">Set a new password</p>
      <h2 className="auth-display-lg">
        Almost back
        <br />
        in your account.
      </h2>
      <p className="auth-lede">
        Pick a password you have not used here before. Once it saves, you can
        sign in and pick up where you left off.
      </p>
    </>
  )
}

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const { resetPassword } = useAuth()
  const { pushToast } = useAuthToast()

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  const setFieldError = (field: keyof FieldErrors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message || undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    if (!token) {
      pushToast({
        kind: "error",
        title: "Missing reset token",
        message: "Open the link from your email, or request a new reset link.",
      })
      return
    }

    const passwordError = validatePassword(password)
    const confirmError =
      confirm !== password ? "Passwords do not match." : ""
    const next: FieldErrors = {
      password: passwordError || undefined,
      confirm: confirmError || undefined,
    }
    setErrors(next)
    if (Object.values(next).filter(Boolean).length) {
      pushToast({
        kind: "error",
        title: "Check the form",
        message: "Fix the highlighted fields and try again.",
      })
      return
    }

    setLoading(true)
    try {
      await resetPassword({ token, password })
      pushToast({
        kind: "success",
        title: "Password updated",
        message: "You can log in with your new password now.",
      })
      router.push("/auth/login")
    } catch (error) {
      pushToast({
        kind: "error",
        title: "Could not reset password",
        message: getAuthErrorMessage(
          error,
          "This link may have expired. Request a new one."
        ),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <p className="auth-eyebrow auth-eyebrow--light">Reset password</p>
      <h1 className="auth-display-md">
        New password ·{" "}
        <Link href="/" className="auth-brand-inline">
          Fix<span>It</span>Now
        </Link>
      </h1>
      <p className="auth-sub">
        Need a fresh link?{" "}
        <Link href="/auth/forgot-password">Request reset again</Link>
      </p>

      {!token ? (
        <div className="auth-fields">
          <p className="field__hint" style={{ fontSize: "0.94rem", color: "#4A5C6B" }}>
            This page needs a reset token from your email. Request a new link if
            yours is missing or expired.
          </p>
          <Link href="/auth/forgot-password" className="btn-auth">
            Send reset link
          </Link>
        </div>
      ) : (
        <form className="auth-fields" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="reset-password">
              New password <span className="field__req">*</span>
            </label>
            <input
              id="reset-password"
              className={`input${errors.password ? " is-error" : ""}`}
              type="password"
              autoComplete="new-password"
              placeholder="8+ characters, one number"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password)
                  setFieldError("password", validatePassword(e.target.value))
              }}
              onBlur={() =>
                setFieldError("password", validatePassword(password))
              }
            />
            {errors.password && (
              <p className="field__error">
                <AlertCircleIcon size={14} />
                {errors.password}
              </p>
            )}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="reset-confirm">
              Confirm password <span className="field__req">*</span>
            </label>
            <input
              id="reset-confirm"
              className={`input${errors.confirm ? " is-error" : ""}`}
              type="password"
              autoComplete="new-password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                if (errors.confirm)
                  setFieldError(
                    "confirm",
                    e.target.value !== password
                      ? "Passwords do not match."
                      : ""
                  )
              }}
              onBlur={() =>
                setFieldError(
                  "confirm",
                  confirm !== password ? "Passwords do not match." : ""
                )
              }
            />
            {errors.confirm && (
              <p className="field__error">
                <AlertCircleIcon size={14} />
                {errors.confirm}
              </p>
            )}
          </div>

          <button className="btn-auth" type="submit" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircleIcon className="btn-auth__spin" />
                Saving…
              </>
            ) : (
              "Save new password"
            )}
          </button>
        </form>
      )}
    </>
  )
}

export default function ResetPasswordPageView() {
  return (
    <AuthShell aside={<ResetAside />}>
      <ResetForm />
    </AuthShell>
  )
}
