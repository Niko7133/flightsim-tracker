import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow hover:bg-primary/90",
        secondary: "border border-input text-white  bg-background shadow-sm hover:bg-accent",
        ghost: "hover:bg-accent",
        destructive: "text-destructive hover:bg-accent hover:text-destructive",
        close: "bg-white/[0.06] hover:bg-white/[0.1]",
      },
      size: {
        default: "h-9 px-4 py-2 rounded-md",
        sm: "h-7 w-7 rounded-md",
        icon: "w-8 h-8 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export default function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={clsx(buttonVariants({ variant, size }), className)} {...props} />;
}
