import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const { migrateLocalModules } = vi.hoisted(() => ({
  migrateLocalModules: vi.fn().mockResolvedValue({ migrated: [], remoteWins: [] }),
}))

vi.mock("@/lib/cloudSync", () => ({
  migrateLocalModules,
}))

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: () => ({ from: vi.fn() }),
}))

import { CloudSyncProvider, useCloudSync } from "./CloudSyncProvider"

function StatusProbe() {
  const sync = useCloudSync()
  return <output data-testid="sync-status">{sync.mode}:{sync.status}:{sync.error || ""}</output>
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("CloudSyncProvider", () => {
  it("is ready immediately in local mode", async () => {
    render(
      <CloudSyncProvider account="teacher@example.com" userId="" cloudClient={null}>
        <StatusProbe />
      </CloudSyncProvider>,
    )

    expect(screen.getByTestId("sync-status")).toHaveTextContent("local:ready")
    expect(migrateLocalModules).not.toHaveBeenCalled()
  })

  it("waits for cloud hydration before becoming ready", async () => {
    let resolveMigration: ((value: { migrated: never[]; remoteWins: never[] }) => void) | undefined
    migrateLocalModules.mockImplementationOnce(
      () => new Promise((resolve) => { resolveMigration = resolve }),
    )

    render(
      <CloudSyncProvider account="teacher@example.com" userId="user-1" cloudClient={{ from: vi.fn() } as never}>
        <StatusProbe />
      </CloudSyncProvider>,
    )

    expect(screen.getByTestId("sync-status")).toHaveTextContent("cloud:loading")
    resolveMigration?.({ migrated: [], remoteWins: [] })
    await waitFor(() => expect(screen.getByTestId("sync-status")).toHaveTextContent("cloud:ready"))
    expect(migrateLocalModules).toHaveBeenCalledOnce()
  })

  it("keeps the app usable and exposes an error when cloud hydration fails", async () => {
    migrateLocalModules.mockRejectedValueOnce(new Error("network down"))

    render(
      <CloudSyncProvider account="teacher@example.com" userId="user-1" cloudClient={{ from: vi.fn() } as never}>
        <StatusProbe />
      </CloudSyncProvider>,
    )

    await waitFor(() => expect(screen.getByTestId("sync-status")).toHaveTextContent("cloud:error:network down"))
  })
})
