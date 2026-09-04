import { useCallback, useEffect, useState } from "react"

/**
 * Runs `fetcher` on mount and whenever `deps` change.
 *
 * `data` starts at `fallback` so a page can render its table shell before the
 * first response lands. `refresh` re-runs the request; `setData` lets a mutation
 * write the row the server returned straight back into state without a refetch.
 *
 * The effect deliberately keys on `deps` rather than on `fetcher`, which pages
 * define inline and would otherwise be a new function on every render.
 */
export function useApi(fetcher, deps = [], fallback = null) {
  const [state, setState] = useState({ data: fallback, error: null, loading: true })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    // One synchronous update marks the request in flight while keeping the
    // previous rows on screen, so a refresh does not blank the table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => (s.loading ? s : { ...s, loading: true }))

    Promise.resolve(fetcher())
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState((s) => ({ ...s, error, loading: false })))

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

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
