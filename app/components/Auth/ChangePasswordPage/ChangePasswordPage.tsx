"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react"

import { useAuth } from "@/app/providers/AuthProvider"
import { getAuthErrorMessage } from "@/lib/auth/errors"

import AuthShell from "../AuthShell/AuthShell"
import { useAuthToast } from "../Toast/AuthToast"

type FieldErrors = {
  currentPassword?: string
  newPassword?: string
  confirm?: string
}

function validateCurrent(value: string) {
  if (!value) return "Enter your current password."
  return ""
}

function validateNew(value: string) {
  if (!value) return "Choose a new password."
  if (value.length < 8) return "Use at least 8 characters."
  if (!/\d/.test(value)) return "Include at least one number."
  return ""
}

function ChangeAside() {
  return (
    <>
      <p className="auth-eyebrow">Account security</p>
      <h2 className="auth-display-lg">
        Change your
        <br />
        password.
      </h2>
      <p className="auth-lede">
        Use a strong password you do not reuse elsewhere. You stay signed in on
        this device after it updates.
      </p>
    </>
  )
}

function ChangeForm() {
  const router = useRouter()
  const { changePassword, user } = useAuth()
  const { pushToast } = useAuthToast()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  const setFieldError = (field: keyof FieldErrors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message || undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    const next: FieldErrors = {
      currentPassword: validateCurrent(currentPassword) || undefined,
      newPassword: validateNew(newPassword) || undefined,
      confirm:
        confirm !== newPassword ? "Passwords do not match." : undefined,
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
      await changePassword({ currentPassword, newPassword })
      pushToast({
        kind: "success",
        title: "Password changed",
        message: "Your account password is updated.",
      })
      router.push("/")
    } catch (error) {
      pushToast({
        kind: "error",
        title: "Could not change password",
        message: getAuthErrorMessage(
          error,
          "Check your current password and try again."
        ),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <p className="auth-eyebrow auth-eyebrow--light">Security</p>
      <h1 className="auth-display-md">
        Change password ·{" "}
        <Link href="/" className="auth-brand-inline">
          Fix<span>It</span>Now
        </Link>
      </h1>
      <p className="auth-sub">
        Signed in as <strong>{user?.email}</strong>
      </p>

      <form className="auth-fields" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="change-current">
            Current password <span className="field__req">*</span>
          </label>
          <input
            id="change-current"
            className={`input${errors.currentPassword ? " is-error" : ""}`}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value)
              if (errors.currentPassword)
                setFieldError("currentPassword", validateCurrent(e.target.value))
            }}
            onBlur={() =>
              setFieldError("currentPassword", validateCurrent(currentPassword))
            }
          />
          {errors.currentPassword && (
            <p className="field__error">
              <AlertCircleIcon size={14} />
              {errors.currentPassword}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="change-new">
            New password <span className="field__req">*</span>
          </label>
          <input
            id="change-new"
            className={`input${errors.newPassword ? " is-error" : ""}`}
            type="password"
            autoComplete="new-password"
            placeholder="8+ characters, one number"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              if (errors.newPassword)
                setFieldError("newPassword", validateNew(e.target.value))
            }}
            onBlur={() => setFieldError("newPassword", validateNew(newPassword))}
          />
          {errors.newPassword && (
            <p className="field__error">
              <AlertCircleIcon size={14} />
              {errors.newPassword}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="change-confirm">
            Confirm new password <span className="field__req">*</span>
          </label>
          <input
            id="change-confirm"
            className={`input${errors.confirm ? " is-error" : ""}`}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              if (errors.confirm)
                setFieldError(
                  "confirm",
                  e.target.value !== newPassword
                    ? "Passwords do not match."
                    : ""
                )
            }}
            onBlur={() =>
              setFieldError(
                "confirm",
                confirm !== newPassword ? "Passwords do not match." : ""
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
              Updating…
            </>
          ) : (
            "Update password"
          )}
        </button>
      </form>
    </>
  )
}

export default function ChangePasswordPageView() {
  return (
    <AuthShell aside={<ChangeAside />}>
      <ChangeForm />
    </AuthShell>
  )
}
