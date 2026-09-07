import type { SupabaseClient } from "@supabase/supabase-js"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { migrateLocalModules, saveCloudModule, snapshotLocalModules } from "@/lib/cloudSync"
import { getSupabaseClient } from "@/lib/supabase"
import { createDebouncedModuleSync, isModuleChangeMessage, type ModuleChangeMessage } from "@/lib/syncProtocol"

export type CloudSyncStatus = "loading" | "saving" | "ready" | "error"

type CloudSyncContextValue = {
  mode: "local" | "cloud"
  status: CloudSyncStatus
  lastSyncedAt: number | null
  error: string
  retry: () => void
}

type CloudSyncProviderProps = {
  account: string
  userId: string
  children: ReactNode
  cloudClient?: SupabaseClient | null
  storage?: Storage
}

const CloudSyncContext = createContext<CloudSyncContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useCloudSync() {
  const context = useContext(CloudSyncContext)
  if (!context) throw new Error("useCloudSync must be used inside CloudSyncProvider")
  return context
}

export function CloudSyncProvider({
  account,
  userId,
  children,
  cloudClient = getSupabaseClient(),
  storage,
}: CloudSyncProviderProps) {
  const mode: CloudSyncContextValue["mode"] = cloudClient && userId ? "cloud" : "local"
  const [status, setStatus] = useState<CloudSyncStatus>(mode === "cloud" ? "loading" : "ready")
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (mode === "local" || !cloudClient || !userId) {
      return
    }

    let active = true
    const activeStorage = storage || window.localStorage
    const queue = createDebouncedModuleSync((message: ModuleChangeMessage) => {
      const payload = snapshotLocalModules(activeStorage, account)[message.module]
      setStatus("saving")
      void saveCloudModule(cloudClient, userId, message.module, payload)
        .then(() => {
          if (!active) return
          setStatus("ready")
          setError("")
          setLastSyncedAt(Date.now())
        })
        .catch((caught: unknown) => {
          if (!active) return
          setStatus("error")
          setError(caught instanceof Error ? caught.message : "云端保存失败")
        })
    })
    const handleMessage = (event: MessageEvent) => {
      if (isModuleChangeMessage(event, window.location.origin)) {
        queue.schedule(event.data as ModuleChangeMessage)
      }
    }
    window.addEventListener("message", handleMessage)

    void migrateLocalModules(cloudClient, activeStorage, userId, account)
      .then(() => {
        if (!active) return
        setStatus("ready")
        setLastSyncedAt(Date.now())
      })
      .catch((caught: unknown) => {
        if (!active) return
        setStatus("error")
        setError(caught instanceof Error ? caught.message : "云端同步失败")
      })

    return () => {
      active = false
      window.removeEventListener("message", handleMessage)
      queue.dispose()
    }
  }, [account, cloudClient, mode, retryCount, storage, userId])

  const retry = useCallback(() => {
    setError("")
    setStatus("loading")
    setRetryCount((value) => value + 1)
  }, [])
  const value = useMemo(() => ({ mode, status, lastSyncedAt, error, retry }), [error, lastSyncedAt, mode, retry, status])

  return <CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider>
}
