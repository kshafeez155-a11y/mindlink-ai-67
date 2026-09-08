import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_6px_20px_oklch(0.575_0.235_275/0.28)] hover:bg-primary-deep hover:-translate-y-px",
        outline: "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary-soft",
        soft: "bg-primary-soft text-primary-deep hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        dark: "bg-navy text-primary-foreground hover:bg-navy-deep",
        success: "bg-success text-success-foreground hover:opacity-90",
        danger: "bg-destructive text-destructive-foreground hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("surface-card", className)} {...props} />;
}

export function SectionHeading({
  title,
  subtitle,
  align = "left",
  className,
}: {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-base text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function StatusIndicator({ online, label }: { online: boolean; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        online ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-success" : "bg-muted-foreground")} />
      {label ?? (online ? "Online" : "Offline")}
    </span>
  );
}

export function Pill({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
      {children}
    </span>
  );
}

export function Avatar({
  src,
  alt,
  className,
  ring,
}: {
  src: string;
  alt: string;
  className?: string;
  ring?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn(
        "h-10 w-10 shrink-0 rounded-full object-cover object-top",
        ring && "ring-2 ring-primary/25 ring-offset-2 ring-offset-card",
        className,
      )}
    />
  );
}

export function Field({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <input
        className={cn(
          "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
          className,
        )}
        {...props}
      />
      {hint ? <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function TextField({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <textarea
        rows={4}
        className={cn(
          "w-full rounded-xl border border-input bg-card px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function StatsCard({
  value,
  label,
  change,
}: {
  value: string;
  label: string;
  change?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {change ? (
        <p className="mt-2 text-xs font-semibold text-success">{change} from last week</p>
      ) : null}
    </Card>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
            active === t
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
