"use client"

import { useEffect, useState } from "react"

/** Valeur retardée (recherche en cours de frappe) : se met à jour `delay` ms après le dernier changement. */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
