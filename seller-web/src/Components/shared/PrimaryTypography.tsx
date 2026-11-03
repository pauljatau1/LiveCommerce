import { cn } from "@/lib/utils"

/**
 * PrimaryTypography component
 * This is a primary typography component for text with default text styles with the primary hex color #27272E.
 * @param {React.ReactNode} children - The content of the typography.
 * @param {string} className - The class name of the typography.
 * @returns {React.ReactNode} - The PrimaryTypography component.
 */

export default function PrimaryTypography({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <p className={cn("text-[#27272E] text-[13px] lg:text-[15px] font-lexend", className)}>{children}</p>
    )
}