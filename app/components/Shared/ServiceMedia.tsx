"use client"

import { useState } from "react"
import { WrenchIcon } from "lucide-react"

import { absoluteMediaUrl } from "@/lib/auth/types"
import { cn } from "@/lib/utils"

import "./ServiceMedia.css"

type ServiceMediaProps = {
  image?: string | null
  title?: string
  className?: string
  imgClassName?: string
  glyphSize?: number
}

/** Service photo with workshop placeholder when missing/broken. */
export default function ServiceMedia({
  image,
  title = "Service",
  className,
  imgClassName,
  glyphSize = 42,
}: ServiceMediaProps) {
  const [broken, setBroken] = useState(false)
  const src = absoluteMediaUrl(image)
  const showImage = Boolean(src) && !broken

  return (
    <span className={cn("svc-media", className)} aria-hidden>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt=""
          className={cn("svc-media__img", imgClassName)}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="svc-media__placeholder">
          <span className="svc-media__glyph">
            <WrenchIcon size={glyphSize} />
          </span>
          <span className="svc-media__label">{title}</span>
        </span>
      )}
    </span>
  )
}
