import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center font-mono text-[11px] font-medium tracking-tight transition-colors border select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#526F61]/10 text-[#526F61] dark:bg-[#8BA997]/15 dark:text-[#8BA997] border-[#526F61]/25 dark:border-[#8BA997]/30",
        secondary:
          "bg-white dark:bg-[#191C1F] text-[#74777C] dark:text-[#A0A4A7] border-[#E6E4DD] dark:border-[#303438]",
        outline:
          "bg-transparent text-[#74777C] dark:text-[#A0A4A7] border-[#E6E4DD] dark:border-[#303438]",
        success:
          "bg-[#526F61]/10 text-[#526F61] dark:bg-[#8BA997]/15 dark:text-[#8BA997] border-[#526F61]/25",
        warning:
          "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
        destructive:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        purple:
          "bg-[#A6B4C2]/15 text-[#4D6073] dark:text-[#A6B4C2] border-[#A6B4C2]/30",
        pink:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        dark:
          "bg-[#17191C] text-[#F5F4F0] dark:bg-[#F4F4F0] dark:text-[#17191C] border-transparent",
      },
      size: {
        default: "px-2 py-0.5 rounded-md",
        sm: "px-1.5 py-0.2 text-[10px] rounded",
        lg: "px-2.5 py-1 text-xs rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
