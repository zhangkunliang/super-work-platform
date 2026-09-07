import type { SupabaseClient } from "@supabase/supabase-js"

type CloudAuthClient = Pick<SupabaseClient, "auth">

export type AuthIdentity = {
  userId: string
  account: string
}

function normalizeAccount(account: string) {
  return account.trim().toLowerCase()
}

function identityFromUser(user: { id: string; email?: string | null } | null): AuthIdentity {
  if (!user?.id || !user.email) throw new Error("Supabase 未返回有效账号")
  return { userId: user.id, account: normalizeAccount(user.email) }
}

export async function signInWithCloud(
  client: CloudAuthClient,
  account: string,
  password: string,
): Promise<AuthIdentity> {
  const { data, error } = await client.auth.signInWithPassword({
    email: normalizeAccount(account),
    password,
  })
  if (error) throw error
  return identityFromUser(data.user)
}

export async function signUpWithCloud(
  client: CloudAuthClient,
  account: string,
  password: string,
  emailRedirectTo?: string,
): Promise<AuthIdentity> {
  const { data, error } = await client.auth.signUp({
    email: normalizeAccount(account),
    password,
    ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
  })
  if (error) throw error
  if (!data.session) throw new Error("注册成功，请完成邮箱验证后登录")
  return identityFromUser(data.user)
}

export async function resetPasswordWithCloud(
  client: CloudAuthClient,
  account: string,
  redirectTo: string,
) {
  const { error } = await client.auth.resetPasswordForEmail(normalizeAccount(account), { redirectTo })
  if (error) throw error
}

export async function updatePasswordWithCloud(
  client: CloudAuthClient,
  password: string,
): Promise<AuthIdentity> {
  const { data, error } = await client.auth.updateUser({ password })
  if (error) throw error
  return identityFromUser(data.user)
}

export async function signOutCloud(client: CloudAuthClient) {
  const { error } = await client.auth.signOut()
  if (error) throw error
}
