import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="mindlink-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.62 0.22 282)" />
          <stop offset="100%" stopColor="oklch(0.5 0.215 268)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#mindlink-mark)" />
      <circle cx="16" cy="10.5" r="3.2" fill="white" />
      <circle cx="9.5" cy="21" r="2.5" fill="white" fillOpacity="0.85" />
      <circle cx="22.5" cy="21" r="2.5" fill="white" fillOpacity="0.85" />
      <path
        d="M16 13.7 10.4 18.9M16 13.7l5.6 5.2M11.6 21.6h8.8"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
    </svg>
  );
}

export function Logo({ className, invert }: { className?: string; invert?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("text-lg font-bold tracking-tight", invert ? "text-white" : "text-foreground")}>
        MindLink
      </span>
    </Link>
  );
}
