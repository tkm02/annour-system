"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useAuth } from "@/contexts/auth-context"
import { groupBySection } from "@/lib/nav-ui"
import { navigationFor } from "@/lib/navigation"
import { NAV_ICONS } from "./sidebar"

/**
 * Palette de navigation (Ctrl+K / ⌘K) : accès rapide aux pages autorisées pour le rôle.
 * Navigation uniquement (décision D12) : aucune recherche de données, aucun appel d'API.
 */
export default function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const sections = groupBySection(navigationFor(user?.role))

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Aller à une page (Ctrl+K)"
        aria-keyshortcuts="Control+K Meta+K"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:w-60 md:px-3"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden md:inline">Aller à…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground md:inline">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Aller à une page"
        description="Tapez le nom d'une page puis validez avec Entrée."
      >
        <CommandInput placeholder="Nom de la page…" />
        <CommandList>
          <CommandEmpty>Aucune page ne correspond.</CommandEmpty>
          {sections.map((section) => (
            <CommandGroup key={section.title} heading={section.title}>
              {section.items.map((item) => {
                const Icon = NAV_ICONS[item.icon]
                return (
                  <CommandItem key={item.href} value={`${section.title} ${item.name}`} onSelect={() => go(item.href)}>
                    <Icon aria-hidden="true" />
                    {item.name}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
