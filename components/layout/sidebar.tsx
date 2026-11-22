"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { navigationFor, type IconName, type NavItem } from "@/lib/navigation";
import { roleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";
import {
  Award,
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FlaskConical,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logoAnnour from "@/public/ANNOUR.png";
import { usePathname } from "next/navigation";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ICONS: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  badge: BadgeCheck,
  certificate: Award,
  message: MessageSquare,
  settings: Settings,
  finance: BarChart3,
  health: Heart,
  science: FlaskConical,
  assign: ClipboardList,
  file: FileText,
  wallet: Wallet,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  report: FileText,
  teacher: GraduationCap,
  visitor: UserCheck,
  stethoscope: Stethoscope,
  census: ClipboardCheck,
};

/** Lien actif : correspondance exacte ou sous-page, en privilégiant l'entrée la plus précise. */
function activeHref(items: NavItem[], pathname: string): string | null {
  let best: string | null = null;
  for (const item of items) {
    if ((pathname === item.href || pathname.startsWith(`${item.href}/`)) && (!best || item.href.length > best.length)) {
      best = item.href;
    }
  }
  return best;
}

function NavList({ items, pathname, onNavigate, onLogout }: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const active = activeHref(items, pathname);
  return (
    <nav className="flex flex-1 flex-col" aria-label="Navigation principale">
      <ul role="list" className="flex flex-1 flex-col gap-y-1">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const isActive = item.href === active;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex gap-x-3 rounded-md p-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.name}
              </Link>
            </li>
          );
        })}
        <li className="mt-auto">
          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full justify-start gap-x-3 text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Déconnexion
          </Button>
        </li>
      </ul>
    </nav>
  );
}

function RoleCard({ role }: { role: string }) {
  return (
    <div className="px-3 py-2 bg-sidebar-accent rounded-md text-white">
      <p className="text-xs">Connecté en tant que</p>
      <p className="text-sm font-medium">{roleLabel(role).toLocaleUpperCase()}</p>
    </div>
  );
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const { user, logout } = useAuth();
  const navigation = navigationFor(user?.role);

  return (
    <>
      {/* Bureau */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar border-r border-sidebar-border px-6 py-4">
          <Link href="/dashboard" className="flex flex-col items-center gap-y-2 text-center">
            <Image src={logoAnnour} alt="An-Nour — Séminaire Intercommunal de Formation Islamique et Managériale" className="h-auto w-full max-w-[180px]" sizes="180px" priority />
            <p className="text-xs italic text-muted-foreground">An Nour, pour une spiritualité étincelante.</p>
          </Link>
          {user && <RoleCard role={user.role} />}
          <NavList items={navigation} pathname={pathname} onLogout={logout} />
        </div>
      </div>

      {/* Mobile */}
      <div
        className={cn(
          "fixed inset-y-0 z-50 flex w-64 flex-col transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!open}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar border-r border-sidebar-border px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              <Image src={logoAnnour} alt="An-Nour" className="h-14 w-auto" sizes="100px" />
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-sidebar-foreground" aria-label="Fermer le menu">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {user && <RoleCard role={user.role} />}
          <NavList items={navigation} pathname={pathname} onNavigate={() => setOpen(false)} onLogout={logout} />
        </div>
      </div>
    </>
  );
}
