"use client"

import { useState } from "react"
import { Menu, User } from "lucide-react"
import { toast } from "react-hot-toast"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { roleLabel } from "@/lib/roles"

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const [confirmAll, setConfirmAll] = useState(false)
  const [closing, setClosing] = useState(false)

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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenuClick} aria-label="Ouvrir le menu">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-x-2" aria-label="Menu utilisateur">
            <User className="h-5 w-5" />
            <span className="hidden sm:block text-sm font-medium">{user?.username || "Utilisateur"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>{user ? roleLabel(user.role) : "Utilisateur"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirmAll(true)}>Déconnecter tous mes appareils</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onSelect={logout}>
            Déconnexion
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
