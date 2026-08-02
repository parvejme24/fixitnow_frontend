"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { StarIcon } from "lucide-react"

import {
  formatReviewDate,
  initialsFromName,
  type Review,
} from "@/app/lib/catalogue"
import { useAuth } from "@/app/providers/AuthProvider"

import "./ReviewForm.css"

type ReviewFormProps = {
  subjectLabel?: string
  onSubmit: (review: Review) => void
}

const MIN_BODY = 12

export default function ReviewForm({
  subjectLabel = "this service",
  onSubmit,
}: ReviewFormProps) {
  const { user, isAuthenticated, isHydrated, isLoading } = useAuth()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState("")
  const [body, setBody] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const active = hover || rating
  const loggedIn = isHydrated && !isLoading && isAuthenticated && Boolean(user)

  useEffect(() => {
    if (user?.name) setName(user.name)
  }, [user?.name])

  const canSubmit = useMemo(() => {
    return (
      loggedIn &&
      rating >= 1 &&
      name.trim().length > 0 &&
      body.trim().length >= MIN_BODY
    )
  }, [loggedIn, rating, name, body])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!loggedIn) {
      setError("Log in to post a review.")
      return
    }
    if (rating < 1) {
      setError("Pick a star rating first.")
      return
    }
    if (!name.trim()) {
      setError("Enter your name.")
      return
    }
    if (body.trim().length < MIN_BODY) {
      setError(`Write at least a short note (${MIN_BODY}+ characters).`)
      return
    }
    const author = name.trim()
    onSubmit({
      author,
      initials: initialsFromName(author),
      rating,
      date: formatReviewDate(),
      body: body.trim(),
    })
    setRating(0)
    setHover(0)
    setBody("")
    setError("")
    setSent(true)
    window.setTimeout(() => setSent(false), 2800)
  }

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <div className="review-form__head">
        <h3>Leave a rating</h3>
        <p>Tell others how {subjectLabel} went.</p>
      </div>

      {!isHydrated || isLoading ? (
        <p className="review-form__gate">Checking sign-in…</p>
      ) : !loggedIn ? (
        <p className="review-form__gate">
          <Link href="/auth/login">Log in</Link> to post a review.
        </p>
      ) : null}

      <div className="review-form__stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => {
          const on = value <= active
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              className={`review-form__star${on ? " is-on" : ""}`}
              disabled={!loggedIn}
              onMouseEnter={() => loggedIn && setHover(value)}
              onMouseLeave={() => setHover(0)}
              onFocus={() => loggedIn && setHover(value)}
              onBlur={() => setHover(0)}
              onClick={() => {
                if (!loggedIn) return
                setRating(value)
                setError("")
              }}
            >
              <StarIcon
                size={28}
                fill={on ? "#FFC93C" : "transparent"}
                color={on ? "#E5A900" : "#9AABB8"}
              />
            </button>
          )
        })}
        <span className="review-form__hint">
          {rating ? `${rating}.0 / 5` : "Tap a star"}
        </span>
      </div>

      <label className="review-form__field">
        <span>Your name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ayesha Siddika"
          maxLength={48}
          autoComplete="name"
          disabled={!loggedIn}
          required
        />
      </label>

      <label className="review-form__field">
        <span>Your review</span>
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            if (error) setError("")
          }}
          placeholder="What went well? Timing, quality, cleanliness…"
          rows={4}
          maxLength={480}
          disabled={!loggedIn}
          required
        />
        <em>{body.length}/480</em>
      </label>

      {error && <p className="review-form__error">{error}</p>}
      {sent && (
        <p className="review-form__ok" role="status">
          Thanks — your review is live below.
        </p>
      )}

      <button
        type="submit"
        className="review-form__submit"
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
      >
        Post review
      </button>
    </form>
  )
}
