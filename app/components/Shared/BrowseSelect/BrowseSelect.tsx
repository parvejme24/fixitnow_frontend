"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type BrowseSelectOption = {
  value: string
  label: string
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
}

export default function BrowseSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  className,
  triggerClassName,
  contentClassName,
  "aria-label": ariaLabel,
}: BrowseSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next != null) onValueChange(String(next))
      }}
      items={options.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "browse-ui-select h-11 w-full min-w-[11.5rem] cursor-pointer rounded-[10px] border-[1.5px] border-[#E2E8ED] bg-white px-3 py-2.5 text-[0.9rem] text-[#0E141B] shadow-none transition-colors hover:border-[#9AABB8] focus-visible:border-[#FFC93C] focus-visible:ring-2 focus-visible:ring-[#FFC93C]/35 data-placeholder:text-[#6E8091] data-[size=default]:h-11 [&_svg]:text-[#4A5C6B]",
          triggerClassName
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className={cn(
          "z-[120] max-h-72 min-w-[var(--anchor-width)] overflow-hidden rounded-[12px] border border-[#E2E8ED] bg-white p-1.5 text-[#0E141B] shadow-[0_16px_40px_rgba(14,20,27,0.14)] ring-0",
          contentClassName,
          className
        )}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="cursor-pointer rounded-[8px] py-2.5 pr-8 pl-2.5 text-[0.9rem] text-[#0E141B] focus:bg-[#FFC93C]/18 focus:text-[#0E141B] data-highlighted:bg-[#FFC93C]/18"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
