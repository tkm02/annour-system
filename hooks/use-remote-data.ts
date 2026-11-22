"use client"

import { useCallback, useEffect, useState } from "react"

interface Result<T> {
  source: unknown
  key: string
  data?: T
  error?: unknown
}

/**
 * Chargement d'une ressource de l'API : relancé quand `fetcher` (mémoïsé par l'appelant), `version` ou `reload()`
 * changent. Une réponse obsolète est ignorée. Pendant un rechargement, les données précédentes restent affichées ;
 * avec `keepPrevious: false`, seulement si elles proviennent du même `fetcher` (ex. même fiche).
 */
export function useRemoteData<T>(
  fetcher: (() => Promise<T>) | null,
  version: number | string = 0,
  { keepPrevious = true }: { keepPrevious?: boolean } = {},
) {
  const [nonce, setNonce] = useState(0)
  const [result, setResult] = useState<Result<T> | null>(null)
  const key = `${version}#${nonce}`

  useEffect(() => {
    if (!fetcher) return
    let active = true
    fetcher().then(
      (data) => { if (active) setResult({ source: fetcher, key, data }) },
      (error: unknown) => { if (active) setResult({ source: fetcher, key, error: error ?? new Error() }) },
    )
    return () => {
      active = false
    }
  }, [fetcher, key])

  const current = !!result && result.source === fetcher && result.key === key
  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return {
    data: result && result.error === undefined && (keepPrevious || result.source === fetcher) ? result.data : undefined,
    error: current ? result.error : undefined,
    loading: !!fetcher && !current,
    reload,
  }
}
