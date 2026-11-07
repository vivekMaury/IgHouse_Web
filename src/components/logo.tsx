import Image from "next/image";

interface BrandLogoProps {
  size?: "sm" | "default" | "lg";
  showText?: boolean;
  variant?: "dark" | "auto";
  className?: string;
}

const iconSizes = {
  sm: { wh: 24, css: "size-6 rounded-lg" },
  default: { wh: 32, css: "size-8 rounded-[10px]" },
  lg: { wh: 40, css: "size-10 rounded-xl" },
} as const;

const textSizes = {
  sm: "text-sm",
  default: "text-[15px]",
  lg: "text-lg",
} as const;

export function BrandLogo({
  size = "default",
  showText = true,
  variant = "dark",
  className = "",
}: BrandLogoProps) {
  const icon = iconSizes[size];
  const inboxColor = variant === "dark" ? "text-white" : "text-foreground";

  return (
    <span className={`inline-flex shrink-0 items-center gap-2.5 ${className}`}>
      <Image
        src="/favicon-192.png"
        alt=""
        width={icon.wh}
        height={icon.wh}
        className={`${icon.css} shrink-0`}
        aria-hidden="true"
        priority
      />
      {showText && (
        <span
          className={`${textSizes[size]} font-semibold tracking-tight`}
        >
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            Ig
          </span>
          <span className={inboxColor}>Inbox</span>
        </span>
      )}
    </span>
  );
}
