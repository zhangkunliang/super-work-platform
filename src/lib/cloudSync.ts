import type { SupabaseClient } from "@supabase/supabase-js"
import { PRIVATE_CLOUD_MODULES, type CloudModule, type CloudModulePayload, type CloudModuleRow } from "./cloudTypes"

const MODULE_KEYS: Record<CloudModule, readonly string[]> = {
  teaching: [
    "zhixing.calendar-settings.v1",
    "zhixing.calendar-events.v1",
    "zhixing.schedule.v1",
    "zhixing.students.v1",
    "zhixing.exams.v1",
    "zhixing.classes.v1",
    "zhixing.active-class.v1",
    "zhixing.seating-layouts.v1",
    "zhixing.prep-links.v1",
    "zhixing.prep-links.v2",
    "zhixing.prep-links.v3",
    "zhixing.prep-records.v1",
  ],
  homeroom: [
    "zhixing.notices.v1",
    "zhixing.notice-templates.v1",
    "zhixing.class-notice.templates.v1",
  ],
  workspace: [
    "zhixing.workspaces.v3",
    "zhixing.profile.v2",
    "zhixing.profile.v3",
    "zhixing.home-modules.v1",
  ],
}

type CloudSyncClient = Pick<SupabaseClient, "from">

type MigrationDependencies = {
  loadCloudModules: (client: CloudSyncClient, userId: string) => Promise<CloudModulePayloads>
  saveCloudModule: (
    client: CloudSyncClient,
    userId: string,
    module: CloudModule,
    payload: CloudModulePayload,
  ) => Promise<void>
}

export type CloudModulePayloads = Record<CloudModule, CloudModulePayload>

export type MigrationResult = {
  migrated: CloudModule[]
  remoteWins: CloudModule[]
}

function emptyModulePayloads(): CloudModulePayloads {
  return {
    teaching: {},
    homeroom: {},
    workspace: {},
  }
}

function accountPrefix(account: string) {
  return `zhixing.account.${encodeURIComponent(account)}.`
}

function parseStorageValue(value: string) {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function hasPayload(payload: CloudModulePayload) {
  return Object.keys(payload).length > 0
}

export function snapshotLocalModules(storage: Storage, account: string): CloudModulePayloads {
  const prefix = accountPrefix(account)
  const payloads = emptyModulePayloads()

  for (const module of PRIVATE_CLOUD_MODULES) {
    for (const key of MODULE_KEYS[module]) {
      const value = storage.getItem(`${prefix}${key}`)
      if (value !== null) payloads[module][key] = parseStorageValue(value)
    }
  }

  return payloads
}

export function hydrateLocalModules(
  storage: Storage,
  account: string,
  payloads: Partial<CloudModulePayloads>,
) {
  const prefix = accountPrefix(account)

  for (const module of PRIVATE_CLOUD_MODULES) {
    const payload = payloads[module]
    if (!payload) continue

    for (const key of MODULE_KEYS[module]) {
      if (!(key in payload)) continue
      storage.setItem(`${prefix}${key}`, JSON.stringify(payload[key]))
    }
  }
}

export async function loadCloudModules(client: CloudSyncClient, userId: string): Promise<CloudModulePayloads> {
  const { data, error } = await client
    .from("user_module_data")
    .select("module,payload,updated_at")
    .eq("user_id", userId)
    .in("module", [...PRIVATE_CLOUD_MODULES])

  if (error) throw error

  const payloads = emptyModulePayloads()
  for (const row of (data || []) as CloudModuleRow[]) {
    if (!PRIVATE_CLOUD_MODULES.includes(row.module)) continue
    payloads[row.module] = row.payload && typeof row.payload === "object" ? row.payload : {}
  }
  return payloads
}

export async function saveCloudModule(
  client: CloudSyncClient,
  userId: string,
  module: CloudModule,
  payload: CloudModulePayload,
) {
  const { error } = await client.from("user_module_data").upsert(
    {
      user_id: userId,
      module,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,module" },
  )

  if (error) throw error
}

export async function migrateLocalModules(
  client: CloudSyncClient,
  storage: Storage,
  userId: string,
  account: string,
  dependencies: MigrationDependencies = { loadCloudModules, saveCloudModule },
): Promise<MigrationResult> {
  const localPayloads = snapshotLocalModules(storage, account)
  const remotePayloads = await dependencies.loadCloudModules(client, userId)
  const result: MigrationResult = { migrated: [], remoteWins: [] }

  for (const module of PRIVATE_CLOUD_MODULES) {
    const localPayload = localPayloads[module]
    const remotePayload = remotePayloads[module]

    if (hasPayload(remotePayload)) {
      hydrateLocalModules(storage, account, { [module]: remotePayload })
      if (hasPayload(localPayload)) result.remoteWins.push(module)
      continue
    }

    if (hasPayload(localPayload)) {
      await dependencies.saveCloudModule(client, userId, module, localPayload)
      result.migrated.push(module)
    }
  }

  return result
}

export { MODULE_KEYS }
