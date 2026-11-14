import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#526F61] dark:focus-visible:ring-[#8BA997] disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#526F61] dark:bg-[#8BA997] text-white dark:text-[#111315] hover:bg-[#445D51] dark:hover:bg-[#9EBEAA] border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:scale-[0.99]",
        secondary:
          "bg-white dark:bg-[#191C1F] text-[#17191C] dark:text-[#F4F4F0] border border-[#E6E4DD] dark:border-[#303438] hover:bg-[#F5F4F0] dark:hover:bg-[#23272B] active:scale-[0.99] shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
        outline:
          "bg-transparent text-[#17191C] dark:text-[#F4F4F0] border border-[#E6E4DD] dark:border-[#303438] hover:bg-white dark:hover:bg-[#191C1F] active:scale-[0.99]",
        ghost:
          "bg-transparent text-[#74777C] dark:text-[#A0A4A7] hover:text-[#17191C] dark:hover:text-[#F4F4F0] hover:bg-[#E6E4DD]/40 dark:hover:bg-[#303438]/40",
        destructive:
          "bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 active:scale-[0.99]",
        purple:
          "bg-white dark:bg-[#191C1F] text-[#17191C] dark:text-[#F4F4F0] border border-[#E6E4DD] dark:border-[#303438] hover:border-[#526F61] dark:hover:border-[#8BA997] active:scale-[0.99]",
        pink:
          "bg-white dark:bg-[#191C1F] text-[#17191C] dark:text-[#F4F4F0] border border-[#E6E4DD] dark:border-[#303438] hover:border-[#526F61] dark:hover:border-[#8BA997] active:scale-[0.99]",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 rounded-md text-xs",
        lg: "h-12 px-6 rounded-lg text-sm font-medium",
        icon: "h-9 w-9 p-0 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
