import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[#E6E4DD] dark:border-[#303438] bg-white dark:bg-[#191C1F] px-4 py-2 text-sm text-[#17191C] dark:text-[#F4F4F0] placeholder:text-[#74777C] dark:placeholder:text-[#A0A4A7] focus-visible:outline-none focus-visible:border-[#526F61] dark:focus-visible:border-[#8BA997] focus-visible:ring-1 focus-visible:ring-[#526F61] dark:focus-visible:ring-[#8BA997] disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
