import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, Menu, Search, Settings, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth";
import { useAccountType } from "@/hooks/use-account-type";
import rahul from "@/assets/creator-rahul.jpg";

const links = [
  { label: "Discover", to: "/explore" as const },
  { label: "Creators", to: "/explore" as const, search: { view: "creators" as const } },
  { label: "Categories", to: "/explore" as const, search: { category: "All" as const } },
  { label: "For Creators", to: "/creator/onboarding" as const },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { accountType } = useAccountType();
  const isCreator = accountType === "creator";
  const visibleLinks = links.filter(
    (link) => link.to !== "/creator/onboarding" || (!loading && (!user || isCreator)),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 sm:px-6 lg:flex lg:justify-between">
        <div className="flex min-w-0 items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {visibleLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                {...(l.search ? { search: l.search } : {})}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "text-primary" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/explore">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="h-4.5 w-4.5" />
            </Button>
          </Link>
          {loading ? (
            <span className="px-3 text-sm text-muted-foreground">Loading...</span>
          ) : user ? (
            <>
              {isCreator ? (
                <>
                  <Link to="/creator/dashboard">
                    <Button variant="outline" size="sm">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Button>
                  </Link>
                  <Link to="/creator/settings">
                    <Button variant="ghost" size="icon" aria-label="Settings">
                      <Settings className="h-4.5 w-4.5" />
                    </Button>
                  </Link>
                </>
              ) : null}
              <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                Sign Out
              </Button>
              <img
                src={rahul}
                alt={user.email ?? "Account"}
                className="h-9 w-9 rounded-full object-cover object-top ring-2 ring-primary/25"
              />
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" onClick={() => undefined}>
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="justify-self-end rounded-lg p-2 text-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-card px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {visibleLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                {...(l.search ? { search: l.search } : {})}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid gap-2">
            {loading ? (
              <span className="px-3 py-2 text-sm text-muted-foreground">Loading...</span>
            ) : user ? (
              <>
                {isCreator ? (
                  <Link to="/creator/dashboard" onClick={() => setOpen(false)}>
                    <Button className="w-full">Dashboard</Button>
                  </Link>
                ) : null}
                <Button variant="outline" className="w-full" onClick={() => void signOut()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
