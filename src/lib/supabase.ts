import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { PRIVATE_CLOUD_MODULES } from "./cloudTypes"

export { PRIVATE_CLOUD_MODULES }

export type SupabaseConfig = {
  url: string
  anonKey: string
}

let client: SupabaseClient | null | undefined

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) return null

  return { url, anonKey }
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null
}

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client

  const config = getSupabaseConfig()
  client = config ? createClient(config.url, config.anonKey) : null
  return client
}
