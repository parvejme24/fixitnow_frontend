"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

import "./BrowseSelect.css"

export type BrowseSelectOption = {
  value: string
  label: string
  /** Optional secondary line under the label. */
  description?: string
  /** Optional leading icon in the menu row. */
  icon?: ReactNode
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
        `${option.label} ${option.description || ""} ${option.keywords || ""} ${option.value}`.toLowerCase()
      return hay.includes(q)
    })
  }, [options, query, searchable])

  const updatePosition = () => {
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const longest = options.reduce((max, option) => {
      const text = option.description
        ? `${option.label} ${option.description}`
        : option.label
      return Math.max(max, text.length)
    }, 0)
    const contentWidth = Math.ceil(longest * 7.6 + (options.some((o) => o.icon) ? 72 : 52))
    const width = Math.min(
      Math.max(rect.width, contentWidth, 220),
      Math.max(window.innerWidth - 24, 200)
    )
    let left = rect.left
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12)
    }
    setMenuPos({
      top: rect.bottom + 6,
      left,
      width,
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
  }, [open, options])

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
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 text-left",
            !selected && "text-[#6E8091]"
          )}
        >
          {selected?.icon ? (
            <span className="browse-select-trigger__icon" aria-hidden>
              {selected.icon}
            </span>
          ) : null}
          <span className="truncate">{selected?.label || placeholder}</span>
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
                          option.icon && "has-icon",
                          option.description && "has-desc",
                          active && "is-active"
                        )}
                        onClick={() => pick(option.value)}
                      >
                        {option.icon ? (
                          <span className="browse-select-option__icon" aria-hidden>
                            {option.icon}
                          </span>
                        ) : null}
                        <span className="browse-select-option__text">
                          <span className="browse-select-option__label">
                            {option.label}
                          </span>
                          {option.description ? (
                            <span className="browse-select-option__desc">
                              {option.description}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className="browse-select-option__check"
                          aria-hidden={!active}
                        >
                          {active ? <CheckIcon size={15} strokeWidth={2.5} /> : null}
                        </span>
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
