import { useEffect, useRef, useState } from "react"

// Throttles a fast-changing value (streamed text) so an expensive downstream
// re-parse (react-markdown) doesn't run on every single token.
export function useThrottledValue<T>(value: T, intervalMs: number, active: boolean): T {
  const [throttled, setThrottled] = useState(value)
  const lastRunRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!active) {
      setThrottled(value)
      return
    }

    const now = Date.now()
    const elapsed = now - lastRunRef.current

    if (elapsed >= intervalMs) {
      lastRunRef.current = now
      setThrottled(value)
      return
    }

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      lastRunRef.current = Date.now()
      setThrottled(value)
    }, intervalMs - elapsed)

    return () => clearTimeout(timeoutRef.current)
  }, [value, intervalMs, active])

  // Always snap to the final value once streaming stops.
  useEffect(() => {
    if (!active) setThrottled(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return throttled
}
