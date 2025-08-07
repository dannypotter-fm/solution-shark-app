"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MultiSelectProps {
  options: { value: string; label: string; email?: string }[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options...",
  className
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value]
    onSelectionChange(newSelection)
  }

  const handleRemove = (value: string) => {
    onSelectionChange(selectedValues.filter(v => v !== value))
  }

  const selectedOptions = options.filter(option => selectedValues.includes(option.value))

  return (
    <div className={cn("space-y-2", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            <span className="truncate">
              {selectedValues.length === 0
                ? placeholder
                : `${selectedValues.length} selected`}
            </span>
            <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-60 overflow-y-auto" align="start">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                selectedValues.includes(option.value) && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleSelect(option.value)}
            >
              <div className="flex h-4 w-4 items-center justify-center">
                {selectedValues.includes(option.value) && (
                  <CheckIcon className="h-4 w-4" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                {option.email && (
                  <span className="text-xs text-muted-foreground">{option.email}</span>
                )}
              </div>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <span className="truncate max-w-[120px]">{option.label}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleRemove(option.value)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
} 