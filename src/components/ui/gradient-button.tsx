"use client";

import { cn } from "cn";
import { forwardRef } from "react";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, size = "default", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand font-semibold text-white transition-all",
          "hover:shadow-[0_0_24px_rgba(229,25,127,0.3)] hover:brightness-110 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          size === "sm" && "h-8 px-4 text-xs",
          size === "default" && "h-10 px-6 text-sm",
          size === "lg" && "h-12 px-8 text-base",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

GradientButton.displayName = "GradientButton";
