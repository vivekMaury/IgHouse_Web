import { Zap } from "lucide-react";
import { cn } from "cn";

interface LogoProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  showText?: boolean;
}

const sizes = {
  sm: { box: "h-6 w-6 rounded-md", icon: "h-3 w-3", text: "text-base" },
  default: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4", text: "text-xl" },
  lg: { box: "h-10 w-10 rounded-xl", icon: "h-5 w-5", text: "text-2xl" },
};

export function Logo({ className, size = "default", showText = true }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("flex items-center justify-center bg-gradient-brand", s.box)}>
        <Zap className={cn("text-white", s.icon)} />
      </span>
      {showText && (
        <span className={cn("font-bold tracking-tight", s.text)}>
          Ig<span className="text-[var(--primary)]">House</span>
        </span>
      )}
    </span>
  );
}
