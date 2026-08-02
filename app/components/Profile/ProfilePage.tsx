"use client"

import Link from "next/link"
import { useEffect, useId, useState, type FormEvent } from "react"
import {
  CameraIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react"

import AuthGuard from "@/app/providers/AuthGuard"
import { useAuth } from "@/app/providers/AuthProvider"
import { getAuthErrorMessage } from "@/lib/auth/errors"
import {
  absoluteMediaUrl,
  initialsFromName,
  type AuthUser,
} from "@/lib/auth/types"
import { DashToastHost, useDashToasts } from "@/app/components/Dashboard/DashShared"
import ProfileShell, { ProfileBreadcrumb } from "./ProfileShell"

import "@/app/components/Dashboard/dashboard.css"
import "./profile.css"

function ProfileForm({ user }: { user: AuthUser }) {
  const { updateProfile, refreshUser } = useAuth()
  const { toasts, pushToast } = useDashToasts()
  const fileId = useId()

  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? "")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(
    absoluteMediaUrl(user.image)
  )
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState("")
  const [fileInputKey, setFileInputKey] = useState(0)

  useEffect(() => {
    setName(user.name)
    setPhone(user.phone ?? "")
    if (!imageFile) setPreview(absoluteMediaUrl(user.image))
  }, [user, imageFile])

  useEffect(() => {
    if (!imageFile) return
    const url = URL.createObjectURL(imageFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const clearSelectedImage = () => {
    setImageFile(null)
    setPreview(absoluteMediaUrl(user.image))
    setFileInputKey((k) => k + 1)
  }

  const initials = user.initials || initialsFromName(user.name || user.email)
  const dirty =
    name.trim() !== user.name ||
    (phone.trim() || "") !== (user.phone ?? "") ||
    Boolean(imageFile)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const nextName = name.trim()
    if (!nextName) {
      setNameError("Add your name so technicians know who booked.")
      return
    }
    setNameError("")
    if (!dirty || saving) return

    setSaving(true)
    try {
      await updateProfile({
        name: nextName,
        phone: phone.trim(),
        initials: initialsFromName(nextName),
        image: imageFile ?? undefined,
      })
      setImageFile(null)
      await refreshUser()
      pushToast("Profile updated", "Your account details were saved.")
    } catch (error) {
      pushToast(
        "Could not save profile",
        getAuthErrorMessage(error, "Please try again."),
        "error"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <form className="profile-card" onSubmit={(e) => void onSubmit(e)}>
        <div className="profile-card__hero">
          <div className="profile-avatar-wrap">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="profile-avatar-img" />
            ) : (
              <span className="profile-avatar-fallback">{initials}</span>
            )}
            <label className="profile-avatar-btn" htmlFor={fileId}>
              <CameraIcon size={16} />
              <span>Photo</span>
            </label>
            {imageFile ? (
              <button
                type="button"
                className="profile-avatar-clear"
                aria-label="Remove selected photo"
                title="Remove selected photo"
                onClick={clearSelectedImage}
              >
                <XIcon size={14} />
              </button>
            ) : null}
            <input
              key={fileInputKey}
              id={fileId}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                if (!file) {
                  setImageFile(null)
                  return
                }
                const allowed = [
                  "image/jpeg",
                  "image/png",
                  "image/webp",
                  "image/gif",
                ]
                if (!allowed.includes(file.type)) {
                  pushToast(
                    "Invalid image",
                    "Use JPEG, PNG, WEBP, or GIF only.",
                    "error"
                  )
                  setFileInputKey((k) => k + 1)
                  return
                }
                if (file.size > 5 * 1024 * 1024) {
                  pushToast(
                    "Image too large",
                    "Keep the photo under 5MB.",
                    "error"
                  )
                  setFileInputKey((k) => k + 1)
                  return
                }
                setImageFile(file)
              }}
            />
          </div>
          <div>
            <p className="profile-eyebrow">My profile</p>
            <h1 className="profile-title">{user.name}</h1>
            <p className="profile-sub">{user.email}</p>
            <span className="profile-role">{user.role.toLowerCase()}</span>
          </div>
        </div>

        <div className="profile-fields">
          <label className="field">
            <span>Full name *</span>
            <input
              className={`dash-input${nameError ? " is-error" : ""}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (e.target.value.trim()) setNameError("")
              }}
              autoComplete="name"
            />
            {nameError ? <em className="field-error">{nameError}</em> : null}
          </label>

          <label className="field">
            <span>Email</span>
            <input
              className="dash-input"
              value={user.email}
              disabled
              readOnly
            />
            <small className="field-hint">
              Email is used for login and password resets.
            </small>
          </label>

          <label className="field">
            <span>Phone</span>
            <input
              className="dash-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
            />
          </label>

          <div className="field">
            <span>Account</span>
            <div className="profile-meta-row">
              <span className="profile-meta-chip profile-meta-chip--role">
                <em>Role</em>
                {user.role}
              </span>
              <span
                className={`profile-meta-chip profile-meta-chip--status${
                  user.isActive === false ? " is-inactive" : " is-active"
                }`}
              >
                <em>Status</em>
                {user.isActive === false ? "Inactive" : "Active"}
              </span>
              {user.createdAt ? (
                <span className="profile-meta-chip profile-meta-chip--joined">
                  <em>Joined</em>
                  {new Date(user.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <Link
            href="/auth/change-password"
            className="dash-btn dash-btn--secondary"
          >
            <KeyRoundIcon size={16} />
            Change password
          </Link>
          <button
            type="submit"
            className="dash-btn dash-btn--primary"
            disabled={!dirty || saving}
          >
            {saving ? (
              <>
                <LoaderCircleIcon size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <UserRoundIcon size={16} />
                Save profile
              </>
            )}
          </button>
        </div>
      </form>
      <DashToastHost toasts={toasts} />
    </>
  )
}

function ProfileBody() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="profile-page profile-page--dash">
        <div className="profile-card profile-card--loading">
          <LoaderCircleIcon size={22} className="animate-spin" />
          <p>Loading your profile…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-page profile-page--dash">
        <div className="profile-card">
          <h1 className="profile-title">Sign in required</h1>
          <p className="profile-sub">
            Open your account to view and edit profile details.
          </p>
          <Link
            href="/auth/login?next=/dashboard/profile"
            className="dash-btn dash-btn--primary"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ProfileShell>
      <div className="profile-page profile-page--dash">
        <ProfileBreadcrumb />
        <header className="dash-head" style={{ marginBottom: 8 }}>
          <div>
            <h1 className="dash-title">My profile</h1>
            <p className="dash-sub">
              Update your name, phone, and photo. Password changes stay on a
              separate page.
            </p>
          </div>
        </header>
        <ProfileForm user={user} />
      </div>
    </ProfileShell>
  )
}

export default function ProfilePageView() {
  return (
    <AuthGuard>
      <ProfileBody />
    </AuthGuard>
  )
}
