"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  DollarSign,
  LayoutDashboard,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/estoque", label: "Estoque", icon: Package },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1.5 px-3 py-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
              active
                ? "bg-white/95 text-teal-900 shadow-lg shadow-black/10"
                : "text-teal-100/90 hover:bg-white/10 hover:text-white"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                active ? "bg-teal-50 text-teal-700" : "bg-white/5 text-inherit"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1.5 overflow-x-auto px-3 pb-3">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-200",
              active
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                : "bg-white/80 text-slate-600 shadow-sm hover:bg-teal-50"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};
