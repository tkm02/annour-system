"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import { activeHref, groupBySection } from "@/lib/nav-ui";
import { homeFor, navigationFor, type IconName, type NavItem } from "@/lib/navigation";
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
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logoAnnour from "@/public/ANNOUR.png";
import { usePathname } from "next/navigation";

export const NAV_ICONS: Record<IconName, LucideIcon> = {
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

interface SidebarProps {
  /** Barre réduite aux icônes (bureau) */
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Tiroir ouvert (< 1024 px) */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

function NavLink({ item, isActive, collapsed, onNavigate }: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = NAV_ICONS[item.icon];
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-3 rounded-md text-sm transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        isActive
          ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand"
          : "font-medium text-sidebar-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className={cn(collapsed && "sr-only")}>{item.name}</span>
    </Link>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.name}</TooltipContent>
    </Tooltip>
  );
}

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const { user } = useAuth();
  const items = navigationFor(user?.role);
  const active = activeHref(items, pathname);
  const sections = groupBySection(items);

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Navigation principale">
      {sections.map((section, index) => (
        <div key={section.title} className={cn(index > 0 && "mt-4")}>
          {collapsed ? (
            index > 0 && <div className="mx-2 mb-3 border-t border-sidebar-border" aria-hidden="true" />
          ) : (
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              {section.title}
            </p>
          )}
          <ul role="list" className="flex flex-col gap-0.5" aria-label={collapsed ? section.title : undefined}>
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} isActive={item.href === active} collapsed={collapsed} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function RoleFooter({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  if (!user || collapsed) return null;
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">Connecté en tant que</p>
      <p className="text-sm font-semibold text-foreground">{roleLabel(user.role)}</p>
    </div>
  );
}

function Brand({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { user } = useAuth();
  return (
    <Link
      href={homeFor(user?.role)}
      onClick={onNavigate}
      className={cn("flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-5")}
    >
      <Image
        src={logoAnnour}
        alt={collapsed ? "An-Nour — accueil" : ""}
        className={cn("w-auto object-contain", collapsed ? "h-8" : "h-10")}
        sizes="80px"
        priority
      />
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block text-sm font-bold text-foreground">An-Nour</span>
          <span className="block truncate text-xs text-muted-foreground">Back-office des comités</span>
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const close = () => setMobileOpen(false);

  return (
    <>
      {/* Bureau (≥ 1024 px) : barre fixe, dépliée ou réduite aux icônes */}
      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <Brand collapsed={collapsed} />
        <SidebarBody collapsed={collapsed} />
        <div className={cn("flex flex-col gap-2 border-t border-sidebar-border p-3")}>
          <RoleFooter collapsed={collapsed} />
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
            aria-expanded={!collapsed}
            className={cn(
              "flex h-9 items-center gap-3 rounded-md text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed ? "justify-center" : "px-3"
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" aria-hidden="true" /> : <PanelLeftClose className="h-5 w-5" aria-hidden="true" />}
            {!collapsed && <span>Réduire le menu</span>}
          </button>
        </div>
      </aside>

      {/* Mobile et tablette (< 1024 px) : tiroir modal (focus piégé, Échap, retour du focus) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 bg-sidebar p-0 sm:max-w-72 lg:hidden">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navigation principale du back-office</SheetDescription>
          <Brand collapsed={false} onNavigate={close} />
          <SidebarBody collapsed={false} onNavigate={close} />
          <div className="border-t border-sidebar-border p-3">
            <RoleFooter collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
