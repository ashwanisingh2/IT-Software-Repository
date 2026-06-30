"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, MonitorSmartphone, Shield, FileText } from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Software Catalog", href: "/dashboard/software", icon: Package },
  { title: "Endpoints", href: "/inventory", icon: MonitorSmartphone },
  { title: "Audit Logs", href: "/dashboard/audit", icon: Shield },
  { title: "Documentation", href: "/docs", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden border-r bg-muted/40 md:block w-64 min-h-[calc(100vh-3.5rem)] flex-shrink-0">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-tight text-muted-foreground">
            Overview
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  pathname === item.href ? "bg-accent text-primary" : "transparent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
