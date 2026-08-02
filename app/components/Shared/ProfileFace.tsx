"use client"

import { useEffect, useState } from "react"

import { absoluteMediaUrl, avatarFallbackUrl } from "@/lib/auth/types"
import { cn } from "@/lib/utils"

type ProfileFaceProps = {
  image?: string | null
  initials: string
  name?: string
  className?: string
  imgClassName?: string
}

/** Photo, generated avatar, or initials fallback. */
export default function ProfileFace({
  image,
  initials,
  name,
  className,
  imgClassName,
}: ProfileFaceProps) {
  const apiSrc = absoluteMediaUrl(image)
  const generated = avatarFallbackUrl(name || initials, initials)
  // Prefer API image; never leave blank when we can generate an avatar.
  const preferred = apiSrc || generated
  const [src, setSrc] = useState(preferred)
  const [failedGenerated, setFailedGenerated] = useState(false)

  useEffect(() => {
    setSrc(apiSrc || generated)
    setFailedGenerated(false)
  }, [apiSrc, generated])

  if (!src || failedGenerated) {
    return (
      <span className={cn(className)} aria-hidden>
        {initials}
      </span>
    )
  }

  return (
    <span className={cn(className)} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={cn("profile-face__img", imgClassName)}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          if (src !== generated) setSrc(generated)
          else setFailedGenerated(true)
        }}
      />
    </span>
  )
}
