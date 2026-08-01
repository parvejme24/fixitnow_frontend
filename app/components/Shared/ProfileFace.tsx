"use client"

import { useState } from "react"

import { absoluteMediaUrl } from "@/lib/auth/types"
import { cn } from "@/lib/utils"

type ProfileFaceProps = {
  image?: string | null
  initials: string
  className?: string
  imgClassName?: string
}

/** Initials fallback with optional profile photo. */
export default function ProfileFace({
  image,
  initials,
  className,
  imgClassName,
}: ProfileFaceProps) {
  const [broken, setBroken] = useState(false)
  const src = absoluteMediaUrl(image)
  const showImage = Boolean(src) && !broken

  return (
    <span className={cn(className)} aria-hidden>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt=""
          className={cn("profile-face__img", imgClassName)}
          onError={() => setBroken(true)}
        />
      ) : (
        initials
      )}
    </span>
  )
}
