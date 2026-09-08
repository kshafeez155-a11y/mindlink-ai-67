import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { LogoMark } from "@/components/Logo";

const columns = [
  {
    title: "Product",
    items: [
      { label: "Discover", to: "/explore" as const },
      { label: "AI Characters", to: "/explore" as const },
      { label: "For Creators", to: "/creator/onboarding" as const },
      { label: "Pricing", to: "/pricing" as const },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", to: "/" as const },
      { label: "Contact", to: "/" as const },
      { label: "Careers", to: "/" as const },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy", to: "/" as const },
      { label: "Terms", to: "/" as const },
      { label: "AI Safety", to: "/" as const },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[2fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-bold">MindLink</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Meet the AI behind people you trust. A marketplace of AI characters built from real
            expertise.
          </p>
          <div className="mt-5 flex gap-2">
            {[Instagram, Youtube, Linkedin, Twitter].map((Icon, i) => (
              <span
                key={i}
                className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.items.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-muted-foreground hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
        © 2026 MindLink. Demo product with fictional creator profiles.
      </div>
    </footer>
  );
}
