import { describe, expect, it, vi } from "vitest"
import {
  hydrateLocalModules,
  migrateLocalModules,
  snapshotLocalModules,
} from "./cloudSync"

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size
    },
    dump: () => Object.fromEntries(values),
  } as unknown as Storage & { dump: () => Record<string, string> }
}

const prefix = "zhixing.account.teacher%40example.com."

describe("cloud module local cache", () => {
  it("snapshots only private data into the three configured modules", () => {
    const storage = createStorage({
      [`${prefix}zhixing.schedule.v1`]: JSON.stringify({ monday: ["语文"] }),
      [`${prefix}zhixing.notices.v1`]: JSON.stringify([{ title: "家长会" }]),
      [`${prefix}zhixing.profile.v3`]: JSON.stringify({ name: "刘老师" }),
      [`${prefix}zhixing.apps.v1`]: JSON.stringify([{ name: "公共应用" }]),
      "velorah-session-v1": "teacher@example.com",
    })

    expect(snapshotLocalModules(storage, "teacher@example.com")).toEqual({
      teaching: { "zhixing.schedule.v1": { monday: ["语文"] } },
      homeroom: { "zhixing.notices.v1": [{ title: "家长会" }] },
      workspace: { "zhixing.profile.v3": { name: "刘老师" } },
    })
  })

  it("hydrates account-scoped cache without changing public data", () => {
    const storage = createStorage({
      [`${prefix}zhixing.schedule.v1`]: JSON.stringify({ monday: [] }),
      "zhixing.apps.v1": JSON.stringify([{ name: "公共应用" }]),
    })

    hydrateLocalModules(storage, "teacher@example.com", {
      teaching: { "zhixing.schedule.v1": { monday: ["语文"] } },
      homeroom: { "zhixing.notices.v1": [{ title: "值日" }] },
    })

    expect(storage.getItem(`${prefix}zhixing.schedule.v1`)).toBe(JSON.stringify({ monday: ["语文"] }))
    expect(storage.getItem(`${prefix}zhixing.notices.v1`)).toBe(JSON.stringify([{ title: "值日" }]))
    expect(storage.getItem("zhixing.apps.v1")).toBe(JSON.stringify([{ name: "公共应用" }]))
  })

  it("uploads local data only for remote modules that do not exist", async () => {
    const storage = createStorage({
      [`${prefix}zhixing.schedule.v1`]: JSON.stringify({ monday: ["语文"] }),
      [`${prefix}zhixing.notices.v1`]: JSON.stringify([{ title: "家长会" }]),
    })
    const saveCloudModule = vi.fn().mockResolvedValue(undefined)
    const client = { from: vi.fn() }

    const result = await migrateLocalModules(client as never, storage, "user-1", "teacher@example.com", {
      loadCloudModules: async () => ({
        teaching: { "zhixing.schedule.v1": { monday: ["数学"] } },
        homeroom: {},
        workspace: {},
      }),
      saveCloudModule,
    })

    expect(saveCloudModule).toHaveBeenCalledWith(client, "user-1", "homeroom", {
      "zhixing.notices.v1": [{ title: "家长会" }],
    })
    expect(saveCloudModule).toHaveBeenCalledTimes(1)
    expect(result.migrated).toEqual(["homeroom"])
    expect(result.remoteWins).toEqual(["teaching"])
  })
})
