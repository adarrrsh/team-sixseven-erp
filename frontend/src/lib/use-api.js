import { useCallback, useEffect, useRef, useState } from "react"

export function useApi(fetcher, deps = [], fallback = null, { pollMs } = {}) {
  const [state, setState] = useState({ data: fallback, error: null, loading: true })
  const [nonce, setNonce] = useState(0)
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let alive = true
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
