"use client"

import * as React from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * SearchableSelect Component - Redesigned for better UX
 * 
 * A fully functional searchable dropdown that stays open while typing,
 * allows scrolling, and provides a smooth user experience.
 * 
 * @param {Array} options - Array of {value, label} objects
 * @param {string} value - Currently selected value
 * @param {Function} onValueChange - Callback when selection changes
 * @param {string} placeholder - Placeholder text when no value selected
 * @param {string} searchPlaceholder - Placeholder text for search input
 * @param {string} emptyText - Text to show when no results found
 * @param {boolean} disabled - Whether the component is disabled
 */
export function SearchableSelect({
  options = [],
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const dropdownRef = React.useRef(null)
  const searchInputRef = React.useRef(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options

    const query = searchQuery.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    )
  }, [options, searchQuery])

  // Get selected option label
  const selectedOption = options.find((option) => option.value === value)
  const displayValue = selectedOption ? selectedOption.label : placeholder

  const handleSelect = (optionValue) => {
    onValueChange(optionValue)
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setSearchQuery("")
      }
    }
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    searchInputRef.current?.focus()
  }

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-[#02020238] bg-white px-3 py-2 text-sm ring-offset-white",
          "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#02020238] focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          disabled && "bg-gray-100 cursor-not-allowed opacity-50",
          !disabled && "hover:bg-gray-50"
        )}
      >
        <span className={cn(
          "block truncate text-left",
          !selectedOption && "text-gray-400"
        )}>
          {displayValue}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform duration-200",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 px-3 py-2 bg-gray-50">
            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400",
                "focus:outline-none"
              )}
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="ml-2 rounded-sm hover:bg-gray-200 p-1"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-8 py-6 text-center text-sm text-gray-500">
                {emptyText}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => {
                  const isSelected = value === option.value
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-8 py-2 text-sm outline-none",
                        "hover:bg-neutral-100 focus:bg-neutral-100",
                        isSelected && "bg-neutral-100"
                      )}
                    >
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {isSelected && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </span>
                      <span className="truncate">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Results Count (optional) */}
          {searchQuery && filteredOptions.length > 0 && (
            <div className="border-t border-gray-200 px-3 py-2 bg-gray-50">
              <p className="text-xs text-gray-500">
                {filteredOptions.length} {filteredOptions.length === 1 ? 'result' : 'results'} found
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
