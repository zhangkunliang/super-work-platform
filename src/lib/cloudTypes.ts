export const PRIVATE_CLOUD_MODULES = ["teaching", "homeroom", "workspace"] as const

export type CloudModule = (typeof PRIVATE_CLOUD_MODULES)[number]

export type CloudModulePayload = Record<string, unknown>

export type CloudModuleRow = {
  user_id: string
  module: CloudModule
  payload: CloudModulePayload
  updated_at: string
}
