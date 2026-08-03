"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

export type BrowseSelectOption = {
  value: string
  label: string
  /** Extra text matched when searchable (e.g. email). */
  keywords?: string
}

type BrowseSelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: BrowseSelectOption[]
  placeholder?: string
  className?: string
  triggerClassName?: string
  contentClassName?: string
  "aria-label"?: string
  /** Show a search input at the top of the dropdown. */
  searchable?: boolean
  searchPlaceholder?: string
}

const triggerClass =
  "browse-ui-select h-11 w-full min-w-[11.5rem] cursor-pointer rounded-[10px] border-[1.5px] border-[#E2E8ED] bg-white px-3 py-2.5 text-[0.9rem] text-[#0E141B] shadow-none transition-colors hover:border-[#9AABB8] focus-visible:border-[#FFC93C] focus-visible:ring-2 focus-visible:ring-[#FFC93C]/35 data-placeholder:text-[#6E8091] data-[size=default]:h-11 [&_svg]:text-[#4A5C6B]"

export default function BrowseSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  className,
  triggerClassName,
  contentClassName,
  "aria-label": ariaLabel,
  searchable = false,
  searchPlaceholder = "Search…",
}: BrowseSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 })

  const selected = options.find((o) => o.value === value)
  const filtered = useMemo(() => {
    if (!searchable) return options
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((option) => {
      const hay =
        `${option.label} ${option.keywords || ""} ${option.value}`.toLowerCase()
      return hay.includes(q)
    })
  }, [options, query, searchable])

  const updatePosition = () => {
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 220),
    })
  }

  useEffect(() => {
    if (!open) return
    updatePosition()
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      const menu = document.getElementById("browse-select-menu")
      if (menu?.contains(target)) return
      setOpen(false)
      setQuery("")
    }
    const onScroll = () => updatePosition()
    document.addEventListener("mousedown", onDoc)
    window.addEventListener("resize", onScroll)
    window.addEventListener("scroll", onScroll, true)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      window.removeEventListener("resize", onScroll)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [open])

  useEffect(() => {
    if (open && searchable) {
      window.setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open, searchable])

  const pick = (next: string) => {
    onValueChange(next)
    setOpen(false)
    setQuery("")
  }

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div ref={rootRef} className={cn("browse-select-searchable", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          triggerClass,
          "flex items-center justify-between gap-2",
          triggerClassName
        )}
        onClick={() => {
          setOpen((v) => !v)
          if (open) setQuery("")
        }}
        onKeyDown={onTriggerKey}
      >
        <span
          className={cn("truncate text-left", !selected && "text-[#6E8091]")}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronDownIcon size={16} className="shrink-0 text-[#4A5C6B]" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              id="browse-select-menu"
              className={cn(
                "browse-select-search-menu z-[1200] overflow-hidden rounded-[12px] border border-[#E2E8ED] bg-white p-1.5 text-[#0E141B] shadow-[0_16px_40px_rgba(14,20,27,0.14)]",
                contentClassName
              )}
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
              }}
              role="listbox"
            >
              {searchable ? (
                <div className="browse-select-search">
                  <SearchIcon size={14} aria-hidden />
                  <input
                    ref={searchRef}
                    className="browse-select-search__input"
                    value={query}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setOpen(false)
                        setQuery("")
                      }
                      if (e.key === "Enter" && filtered[0]) {
                        e.preventDefault()
                        pick(filtered[0].value)
                      }
                    }}
                  />
                </div>
              ) : null}
              <div className="browse-select-options">
                {filtered.length === 0 ? (
                  <p className="browse-select-empty">No matches</p>
                ) : (
                  filtered.map((option) => {
                    const active = option.value === value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={cn(
                          "browse-select-option",
                          active && "is-active"
                        )}
                        onClick={() => pick(option.value)}
                      >
                        <span className="truncate">{option.label}</span>
                        {active ? <CheckIcon size={16} /> : null}
                      </button>
                    )
                  })
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
