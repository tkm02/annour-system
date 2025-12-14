"use client";

import { Button } from "@/components/ui/button";
import { useAuth, type UserRole } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  FileText,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const getNavigationByRole = (role: UserRole) => {
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  switch (role.toLocaleUpperCase()) {
    case "ADMINISTRATION":
      return [
        ...baseNavigation,
        { name: "Séminaristes", href: "/seminaristes", icon: Users },
        { name: "Communication", href: "/communication", icon: MessageSquare },
        { name: "Mini-Admins", href: "/mini-admins", icon: UserPlus },
        { name: "Gérer les accès", href: "/acces", icon: Settings },
      ];

    case "SCIENTIFIQUE":
      return [
        ...baseNavigation,
        { name: "Séminaristes", href: "/seminaristes", icon: Users },
        { name: "Scientifique", href: "/scientifique", icon: GraduationCap },
        { name: "Notes", href: "/notes", icon: FileText },
        { name: "Communication", href: "/communication", icon: MessageSquare },
      ];

    case "SANTE":
      return [
        ...baseNavigation,
        { name: "Séminaristes", href: "/sante/seminaristes", icon: Users },
        { name: "Santé", href: "/sante", icon: Heart },
        { name: "Consultations", href: "/sante/consultations", icon: FileText },
      ];

    case "FINANCE":
      return [
        ...baseNavigation,
        { name: "Vente Tickets", href: "/finance/tickets", icon: CreditCard },
        { name: "Paiements", href: "/finance/payments", icon: FileText },
      ];

    default:
      return baseNavigation;
  }
};

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = user ? getNavigationByRole(user.role) : [];

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar border-r border-sidebar-border px-6 py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <div className="text-white text-sm font-bold">النور</div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-secondary">AN-NOUR</h2>
              <p className="text-xs text-muted-foreground">
                An Nour, pour une spiritualité étincelante.
              </p>
            </div>
          </div>

          {user && (
            <div className="px-3 py-2 bg-sidebar-accent rounded-md">
              <p className="text-xs text-muted-foreground">
                Connecté en tant que
              </p>
              <p className="text-sm font-medium text-sidebar-foreground">
                {user.name}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex gap-x-3 rounded-md p-3 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}

              {/* Logout */}
              <li className="mt-auto">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-x-3 text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="h-5 w-5" />
                  Déconnexion
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 z-50 flex w-64 flex-col transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar border-r border-sidebar-border px-6 py-4">
          {/* Header with close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <div className="text-white text-xs font-bold">النور</div>
              </div>
              <div>
                <h2 className="text-base font-bold text-secondary">AN-NOUR</h2>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-sidebar-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {user && (
            <div className="px-3 py-2 bg-sidebar-accent rounded-md">
              <p className="text-xs text-muted-foreground">
                Connecté en tant que
              </p>
              <p className="text-sm font-medium text-sidebar-foreground">
                {user.name}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex gap-x-3 rounded-md p-3 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}

              {/* Logout */}
              <li className="mt-auto">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-x-3 text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="h-5 w-5" />
                  Déconnexion
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
