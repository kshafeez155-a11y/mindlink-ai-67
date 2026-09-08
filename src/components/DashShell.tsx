import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ComponentType, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  to?: string;
  onClick?: () => void;
  active?: boolean;
};

function NavButton({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = item.active ?? (item.to ? pathname === item.to : false);
  const className = cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    active
      ? "bg-primary-soft text-primary-deep"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
  );
  const inner = (
    <>
      <item.icon className="h-4.5 w-4.5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </>
  );

  if (item.to) {
    return (
      <Link to={item.to} className={className} onClick={onNavigate}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        item.onClick?.();
        onNavigate?.();
      }}
    >
      {inner}
    </button>
  );
}

export function DashShell({
  items,
  children,
  sidebarFooter,
  sidebarExtra,
}: {
  items: NavItem[];
  children: ReactNode;
  sidebarFooter?: ReactNode;
  sidebarExtra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const sidebarBody = (
    <>
      <div className="px-2 pb-4">
        <Logo />
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <NavButton key={item.label} item={item} onNavigate={() => setOpen(false)} />
        ))}
      </nav>
      {sidebarExtra}
      <div className="mt-auto">{sidebarFooter}</div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        {sidebarBody}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-2">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar p-4 shadow-lift">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 p-2 text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarBody}
          </div>
        </div>
      ) : null}
    </div>
  );
}
