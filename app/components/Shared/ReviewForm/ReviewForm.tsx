"use client"

import { useState, type FormEvent } from "react"
import { StarIcon } from "lucide-react"

import {
  formatReviewDate,
  initialsFromName,
  type Review,
} from "@/app/lib/catalogue"

import "./ReviewForm.css"

type ReviewFormProps = {
  subjectLabel?: string
  onSubmit: (review: Review) => void
}

export default function ReviewForm({
  subjectLabel = "this service",
  onSubmit,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState("")
  const [body, setBody] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const active = hover || rating

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError("Pick a star rating first.")
      return
    }
    if (body.trim().length < 12) {
      setError("Write at least a short note (12+ characters).")
      return
    }
    const author = name.trim() || "Anonymous"
    onSubmit({
      author,
      initials: initialsFromName(author === "Anonymous" ? "AN" : author),
      rating,
      date: formatReviewDate(),
      body: body.trim(),
    })
    setRating(0)
    setHover(0)
    setName("")
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
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              onFocus={() => setHover(value)}
              onBlur={() => setHover(0)}
              onClick={() => {
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
        />
        <em>{body.length}/480</em>
      </label>

      {error && <p className="review-form__error">{error}</p>}
      {sent && (
        <p className="review-form__ok" role="status">
          Thanks — your review is live below.
        </p>
      )}

      <button type="submit" className="review-form__submit">
        Post review
      </button>
    </form>
  )
}
