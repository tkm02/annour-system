"use client"

import { Fragment, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, LogOut, Menu, MonitorSmartphone } from "lucide-react"
import { toast } from "react-hot-toast"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { authApi } from "@/lib/api"
import { EDITION } from "@/lib/edition"
import { breadcrumbFor, initials, SUB_PAGE_LABELS } from "@/lib/nav-ui"
import { navigationFor } from "@/lib/navigation"
import { roleLabel } from "@/lib/roles"
import CommandMenu from "./command-menu"

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname() ?? ""
  const [confirmAll, setConfirmAll] = useState(false)
  const [closing, setClosing] = useState(false)
  const crumbs = breadcrumbFor(navigationFor(user?.role), pathname, SUB_PAGE_LABELS)

  // F-A3 : fermer les sessions sur tous les appareils (révocation côté serveur), puis retour à la connexion
  const handleLogoutAll = async () => {
    setClosing(true)
    try {
      await authApi.logoutAll()
      toast.success("Toutes vos sessions ont été fermées")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fermeture des sessions impossible")
    } finally {
      setClosing(false)
      logout()
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Ouvrir le menu">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1
            return (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
                <BreadcrumbItem className={last ? "min-w-0" : "hidden sm:inline-flex"}>
                  {last ? (
                    <BreadcrumbPage className="truncate font-semibold">{crumb.label}</BreadcrumbPage>
                  ) : crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </BreadcrumbItem>
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <CommandMenu />

      <span
        className="hidden items-center rounded-full border border-border bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-strong xl:inline-flex"
        title="Édition en cours"
      >
        {EDITION.libelle} · {EDITION.annee}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-1.5 sm:px-2" aria-label="Menu utilisateur">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
              aria-hidden="true"
            >
              {initials(user?.username)}
            </span>
            <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{user?.username || "Utilisateur"}</span>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <span className="block text-sm font-semibold">{user?.username || "Utilisateur"}</span>
            <span className="block text-xs text-muted-foreground">{user ? roleLabel(user.role) : ""}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirmAll(true)}>
            <MonitorSmartphone aria-hidden="true" />
            Déconnecter tous mes appareils
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={logout}>
            <LogOut aria-hidden="true" />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmAll} onOpenChange={setConfirmAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déconnecter tous vos appareils ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes vos sessions ouvertes (ordinateurs, téléphones) seront fermées, y compris celle-ci.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutAll} disabled={closing}>
              Tout déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
