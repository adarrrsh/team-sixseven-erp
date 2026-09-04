import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Runs `fetcher` on mount and whenever `deps` change.
 *
 * `data` starts at `fallback` so a page can render its table shell before the
 * first response lands. `refresh` re-runs the request; `setData` lets a mutation
 * write the row the server returned straight back into state without a refetch.
 *
 * Pass `pollMs` to keep re-fetching in the background on that interval (paused
 * while the tab is hidden) — unlike `refresh`, a poll tick never flips `loading`
 * back on, so a screen that's already rendering data doesn't flash a skeleton
 * every time it silently checks for updates. A poll that fails is swallowed,
 * leaving the last good data on screen rather than surfacing a transient error.
 *
 * The effect deliberately keys on `deps` rather than on `fetcher`, which pages
 * define inline and would otherwise be a new function on every render.
 */
export function useApi(fetcher, deps = [], fallback = null, { pollMs } = {}) {
  const [state, setState] = useState({ data: fallback, error: null, loading: true })
  const [nonce, setNonce] = useState(0)
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let alive = true
    // One synchronous update marks the request in flight while keeping the
    // previous rows on screen, so a refresh does not blank the table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => (s.loading ? s : { ...s, loading: true }))

    Promise.resolve(fetcherRef.current())
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState((s) => ({ ...s, error, loading: false })))

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  useEffect(() => {
    if (!pollMs) return undefined
    let alive = true
    const id = setInterval(() => {
      if (document.hidden) return
      Promise.resolve(fetcherRef.current())
        .then((data) => alive && setState((s) => ({ ...s, data, error: null })))
        .catch(() => {})
    }, pollMs)
    return () => {
      alive = false
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs, ...deps])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])
  const setData = useCallback(
    (update) =>
      setState((s) => ({
        ...s,
        data: typeof update === "function" ? update(s.data) : update,
      })),
    [],
  )

  return { data: state.data, error: state.error, loading: state.loading, setData, refresh }
}

/**
 * Several endpoints at once. `shape` maps a key to a fetcher; `data` comes back
 * keyed the same way, so a page can destructure what it needs.
 */
export function useApiAll(shape, deps = [], fallback = {}) {
  const keys = Object.keys(shape)

  return useApi(
    async () => {
      const results = await Promise.all(keys.map((key) => shape[key]()))
      return Object.fromEntries(keys.map((key, i) => [key, results[i]]))
    },
    deps,
    fallback,
  )
}
