"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useReducedMotion } from "framer-motion"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  HomeIcon,
  LoaderCircleIcon,
  ShieldIcon,
  WrenchIcon,
} from "lucide-react"

import AuthShell from "../AuthShell/AuthShell"
import { useAuthToast } from "../Toast/AuthToast"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^01[3-9]\d{8}$/

type Role = "customer" | "technician" | "admin"

const PERKS: Record<Role, string[]> = {
  customer: [
    "See booked and free hours before you commit",
    "Pay only after a technician accepts",
    "Cancel free until work starts",
  ],
  technician: [
    "Set your weekly hours once, reuse them forever",
    "Accept or decline in one tap",
    "Payout released when the customer confirms",
  ],
  admin: [
    "Ban, suspend and restore accounts",
    "Watch revenue and dispute volume live",
    "Add or retire service categories",
  ],
}

const TRADES = [
  "Plumbing",
  "Electrical",
  "AC & Cooling",
  "Appliance Repair",
  "Carpentry",
  "Painting",
  "Deep Cleaning",
  "Pest Control",
] as const

const AREAS = [
  "Dhanmondi",
  "Mohammadpur",
  "Gulshan",
  "Uttara",
  "Bashundhara",
  "Mirpur",
  "Banani",
  "Old Dhaka",
] as const

const ROLE_META: Record<
  Role,
  { label: string; desc: string; icon: typeof HomeIcon }
> = {
  customer: {
    label: "Customer",
    desc: "Book a technician",
    icon: HomeIcon,
  },
  technician: {
    label: "Technician",
    desc: "Take on jobs",
    icon: WrenchIcon,
  },
  admin: {
    label: "Admin",
    desc: "Moderate platform",
    icon: ShieldIcon,
  },
}

type Errors = Partial<
  Record<
    "name" | "email" | "phone" | "password" | "trade" | "terms" | "role",
    string
  >
>

function passwordScore(value: string) {
  let score = 0
  if (value.length >= 8) score += 1
  if (/\d/.test(value)) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  return score
}

function passwordNote(value: string) {
  if (!value) return "Use eight characters or more."
  if (value.length < 8) return "Too short — keep typing."
  if (!/\d/.test(value)) return "Add a number."
  if (!/[A-Z]/.test(value)) return "Add a capital letter."
  if (!/[^A-Za-z0-9]/.test(value)) return "Add a symbol for extra strength."
  return "Strong password."
}

function launchConfetti() {
  const colors = [
    "#FFC93C",
    "#12B886",
    "#3D8FE0",
    "#7C6BFF",
    "#FF5A3C",
    "#0E141B",
  ]
  for (let i = 0; i < 50; i += 1) {
    const el = document.createElement("span")
    el.className = "auth-confetti"
    el.style.left = `${Math.random() * 100}vw`
    el.style.background = colors[i % colors.length]
    el.style.animationDuration = `${2.4 + Math.random() * 1.8}s`
    el.style.animationDelay = `${Math.random() * 0.7}s`
    document.body.appendChild(el)
    window.setTimeout(() => el.remove(), 5000)
  }
}

function RegisterAside({ role }: { role: Role }) {
  return (
    <>
      <p className="auth-eyebrow">Two minutes, no card</p>
      <h2 className="auth-display-lg">
        Pick your side
        <br />
        of the job.
      </h2>
      <p className="auth-lede">
        Your role decides what you see after signing up — a booking dashboard, a
        scheduler, or the moderation console. You can only be one at a time.
      </p>

      <ul className="perk-list" id="perks">
        {PERKS[role].map((perk) => (
          <li key={perk}>
            <CheckCircle2Icon size={20} />
            <span>{perk}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

function RegisterForm({
  role,
  setRole,
}: {
  role: Role
  setRole: (role: Role) => void
}) {
  const router = useRouter()
  const reduceMotion = useReducedMotion() ?? false
  const { pushToast } = useAuthToast()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [trade, setTrade] = useState("")
  const [years, setYears] = useState("0")
  const [area, setArea] = useState("Dhanmondi")
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  const score = useMemo(() => passwordScore(password), [password])
  const note = useMemo(() => passwordNote(password), [password])

  const setFieldError = (field: keyof Errors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message || undefined }))
  }

  const validateName = (value: string) => {
    if (!value.trim()) return "Tell us what to call you."
    if (value.trim().length < 3) return "That looks too short for a full name."
    return ""
  }

  const validateEmail = (value: string) => {
    if (!value.trim()) return "We need an email to send booking updates."
    if (!EMAIL_RE.test(value.trim())) return "That email address looks incomplete."
    return ""
  }

  const validatePhone = (value: string) => {
    if (!value.trim()) return "A mobile number is required for slot reminders."
    if (!PHONE_RE.test(value.trim()))
      return "Use an 11-digit number starting 013–019."
    return ""
  }

  const validatePassword = (value: string) => {
    if (!value) return "Choose a password."
    if (value.length < 8) return "Use at least 8 characters."
    if (!/\d/.test(value)) return "Include at least one number."
    return ""
  }

  const validateAll = () => {
    const next: Errors = {
      name: validateName(name) || undefined,
      email: validateEmail(email) || undefined,
      phone: validatePhone(phone) || undefined,
      password: validatePassword(password) || undefined,
      trade:
        role === "technician" && !trade
          ? "Pick the trade you work in."
          : undefined,
      terms: terms
        ? undefined
        : "You need to accept the terms to continue.",
    }
    setErrors(next)
    return Object.values(next).filter(Boolean).length
  }

  const dashboardForRole = (r: Role) => {
    if (r === "technician") return "/technicians"
    if (r === "admin") return "/"
    return "/bookings"
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    const count = validateAll()
    if (count > 0) {
      pushToast({
        kind: "error",
        title: "Almost there",
        message: "Fix the highlighted fields and try again.",
      })
      return
    }

    setLoading(true)
    window.setTimeout(() => {
      if (!reduceMotion) launchConfetti()
      pushToast({
        kind: "success",
        title: "Account created",
        message: `Welcome in. Opening your ${ROLE_META[role].label.toLowerCase()} dashboard.`,
      })
      window.setTimeout(() => {
        router.push(dashboardForRole(role))
      }, 1200)
    }, 1200)
  }

  return (
    <>
      <p className="auth-eyebrow auth-eyebrow--light">Create account</p>
      <h1 className="auth-display-md">
        Join{" "}
        <Link href="/" className="auth-brand-inline">
          Fix<span>It</span>Now
        </Link>
      </h1>
      <p className="auth-sub">
        Already registered? <Link href="/auth/login">Log in instead</Link>
      </p>

      <form className="auth-fields" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <span className="field__label">
            Role <span className="field__req">*</span>
          </span>
          <div className="role-grid" role="radiogroup" aria-label="Account role">
            {(Object.keys(ROLE_META) as Role[]).map((key) => {
              const meta = ROLE_META[key]
              const Icon = meta.icon
              const selected = role === key
              return (
                <label
                  key={key}
                  className={`role-opt${selected ? " is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={key}
                    checked={selected}
                    onChange={() => {
                      setRole(key)
                      if (key !== "technician") setFieldError("trade", "")
                    }}
                  />
                  <Icon className="role-opt__icon size-5" />
                  <span className="role-opt__name">{meta.label}</span>
                  <span className="role-opt__desc">{meta.desc}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="reg-name">
            Full name <span className="field__req">*</span>
          </label>
          <input
            id="reg-name"
            className={`input${errors.name ? " is-error" : ""}`}
            placeholder="e.g. Ayesha Siddika"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setFieldError("name", validateName(e.target.value))
            }}
            onBlur={() => setFieldError("name", validateName(name))}
          />
          {errors.name && (
            <p className="field__error">
              <AlertCircleIcon size={14} />
              {errors.name}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="reg-email">
            Email <span className="field__req">*</span>
          </label>
          <input
            id="reg-email"
            className={`input${errors.email ? " is-error" : ""}`}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email)
                setFieldError("email", validateEmail(e.target.value))
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
          <label className="field__label" htmlFor="reg-phone">
            Mobile <span className="field__req">*</span>
          </label>
          <input
            id="reg-phone"
            className={`input${errors.phone ? " is-error" : ""}`}
            inputMode="numeric"
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              if (errors.phone)
                setFieldError("phone", validatePhone(e.target.value))
            }}
            onBlur={() => setFieldError("phone", validatePhone(phone))}
          />
          <p className="field__hint">
            We send slot reminders by SMS. Bangladeshi numbers only.
          </p>
          {errors.phone && (
            <p className="field__error">
              <AlertCircleIcon size={14} />
              {errors.phone}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="reg-password">
            Password <span className="field__req">*</span>
          </label>
          <input
            id="reg-password"
            className={`input${errors.password ? " is-error" : ""}`}
            type="password"
            placeholder="8+ characters, one number"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password)
                setFieldError("password", validatePassword(e.target.value))
            }}
            onBlur={() => setFieldError("password", validatePassword(password))}
          />
          <div className="strength" data-score={score} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <p className="field__hint">{note}</p>
          {errors.password && (
            <p className="field__error">
              <AlertCircleIcon size={14} />
              {errors.password}
            </p>
          )}
        </div>

        <div
          className={`role-extra${role === "technician" ? " is-open" : ""}`}
          id="tech-extra"
        >
          <div className="auth-fields" style={{ marginTop: 0 }}>
            <div className="field">
              <label className="field__label" htmlFor="reg-trade">
                Primary trade <span className="field__req">*</span>
              </label>
              <select
                id="reg-trade"
                className={`select${errors.trade ? " is-error" : ""}`}
                value={trade}
                onChange={(e) => {
                  setTrade(e.target.value)
                  setFieldError("trade", e.target.value ? "" : "Pick the trade you work in.")
                }}
              >
                <option value="">Select a trade</option>
                {TRADES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {errors.trade && (
                <p className="field__error">
                  <AlertCircleIcon size={14} />
                  {errors.trade}
                </p>
              )}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="reg-years">
                Years of experience
              </label>
              <input
                id="reg-years"
                className="input"
                type="number"
                min={0}
                max={45}
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="reg-area">
                Service area
              </label>
              <select
                id="reg-area"
                className="select"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                {AREAS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <label className="field__check">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => {
              setTerms(e.target.checked)
              if (errors.terms)
                setFieldError(
                  "terms",
                  e.target.checked
                    ? ""
                    : "You need to accept the terms to continue."
                )
            }}
          />
          <span>
            I agree to the service terms and the technician safety standards.
          </span>
        </label>
        {errors.terms && (
          <p className="field__error">
            <AlertCircleIcon size={14} />
            {errors.terms}
          </p>
        )}

        <button className="btn-auth" type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircleIcon className="btn-auth__spin" />
              Creating account…
            </>
          ) : (
            "Create my account"
          )}
        </button>
      </form>
    </>
  )
}

export default function RegisterPageView() {
  const [role, setRole] = useState<Role>("customer")

  return (
    <AuthShell aside={<RegisterAside role={role} />}>
      <RegisterForm role={role} setRole={setRole} />
    </AuthShell>
  )
}
