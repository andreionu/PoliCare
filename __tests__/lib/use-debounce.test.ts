import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebounce } from "@/hooks/use-debounce"

// useDebounce tests require @testing-library/react
// Install with: npm i -D @testing-library/react @testing-library/react-hooks

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300))
    expect(result.current).toBe("hello")
  })

  it("does not update before delay elapses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "initial" },
    })
    rerender({ value: "updated" })
    expect(result.current).toBe("initial")
  })

  it("updates after delay elapses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "initial" },
    })
    rerender({ value: "updated" })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe("updated")
  })

  it("resets timer on rapid changes (only last value wins)", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    })
    rerender({ value: "b" })
    act(() => vi.advanceTimersByTime(100))
    rerender({ value: "c" })
    act(() => vi.advanceTimersByTime(100))
    rerender({ value: "final" })
    // Only 200ms elapsed since "final", still debounced
    expect(result.current).toBe("a")
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe("final")
  })
})
