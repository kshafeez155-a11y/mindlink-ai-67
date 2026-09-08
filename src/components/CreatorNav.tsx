import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Sparkle,
  Wallet,
} from "lucide-react";
import type { NavItem } from "@/components/DashShell";

export const creatorNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/creator/dashboard" },
  { label: "My Character", icon: Sparkle, to: "/creator/character" },
  { label: "Knowledge", icon: BookOpen, to: "/creator/knowledge" },
  { label: "Conversations", icon: MessagesSquare, to: "/creator/conversations" },
  { label: "Analytics", icon: BarChart3, to: "/creator/analytics" },
  { label: "Earnings", icon: Wallet, to: "/creator/earnings" },
  { label: "Settings", icon: Settings, to: "/creator/settings" },
];

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
