import { PRIVATE_CLOUD_MODULES, type CloudModule } from "./cloudTypes"

export type ModuleChangeMessage = {
  type: "zhixing:module-change"
  module: CloudModule
  keys: string[]
}

type MessageEventLike = {
  origin: string
  data: unknown
}

export function isModuleChangeMessage(event: MessageEventLike, expectedOrigin: string): boolean {
  if (event.origin !== expectedOrigin || !event.data || typeof event.data !== "object") return false

  const message = event.data as Partial<ModuleChangeMessage>
  return (
    message.type === "zhixing:module-change" &&
    typeof message.module === "string" &&
    PRIVATE_CLOUD_MODULES.includes(message.module as CloudModule) &&
    Array.isArray(message.keys) &&
    message.keys.every((key) => typeof key === "string")
  )
}

export function createDebouncedModuleSync(onChange: (message: ModuleChangeMessage) => void, delayMs = 500) {
  const pending = new Map<CloudModule, { message: ModuleChangeMessage; timer: number }>()

  const schedule = (message: ModuleChangeMessage) => {
    const existing = pending.get(message.module)
    const keys = Array.from(new Set([...(existing?.message.keys || []), ...message.keys]))
    if (existing) window.clearTimeout(existing.timer)

    const timer = window.setTimeout(() => {
      pending.delete(message.module)
      onChange({ type: message.type, module: message.module, keys })
    }, delayMs)

    pending.set(message.module, { message: { ...message, keys }, timer })
  }

  const dispose = () => {
    pending.forEach(({ timer }) => window.clearTimeout(timer))
    pending.clear()
  }

  return { schedule, dispose }
}
