import { EventEmitter } from "events"

declare global {
  // eslint-disable-next-line no-var
  var __appEventBus: EventEmitter | undefined
}

// Module-level singleton — survives Next.js hot reloads in dev
const bus: EventEmitter = globalThis.__appEventBus ?? new EventEmitter()
if (!globalThis.__appEventBus) {
  globalThis.__appEventBus = bus
  bus.setMaxListeners(200)
}

export type AppEvent = "appointments_updated" | "payment_updated" | "stats_updated"

export function emitAppEvent(event: AppEvent, payload: Record<string, unknown> = {}) {
  bus.emit(event, payload)
}

export function onAppEvent(
  event: AppEvent,
  listener: (data: Record<string, unknown>) => void
): () => void {
  bus.on(event, listener)
  return () => bus.off(event, listener)
}
