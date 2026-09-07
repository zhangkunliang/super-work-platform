import { Button } from "@/components/ui/button"
import { ClickFireworks } from "@/components/ClickFireworks"
import { CloudSyncProvider, useCloudSync } from "@/components/CloudSyncProvider"
import { SeamlessVideo } from "@/components/SeamlessVideo"
import { SignIn2, type AuthMode } from "@/components/ui/clean-minimal-sign-in"
import { resetPasswordWithCloud, signInWithCloud, signOutCloud, signUpWithCloud, updatePasswordWithCloud, type AuthIdentity } from "@/lib/auth"
import { readSessionAccount } from "@/lib/session"
import { getSupabaseClient } from "@/lib/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

const videoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"

function JourneyButton({ hero = false, onClick }: { hero?: boolean; onClick?: () => void }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="ghost"
      className={`journey-cta liquid-glass rounded-full text-foreground hover:scale-[1.03] hover:bg-transparent ${
        hero
          ? "mt-12 h-auto px-14 py-5 text-base tracking-[0.08em] animate-fade-rise-delay-2"
          : "h-auto px-6 py-2.5 text-sm tracking-[0.06em]"
      }`}
    >
      Begin Journey
    </Button>
  )
}

type StoredUser = { account: string; passwordHash: string }
type RememberedCredentials = { account: string }

const USERS_KEY = "velorah-users-v1"
const SESSION_KEY = "velorah-session-v1"
const AUTH_DRAFT_KEY = "velorah-auth-draft-v1"

async function hashPassword(password: string) {
  if (!globalThis.crypto?.subtle) throw new Error("当前浏览器不支持安全的本地登录，请升级浏览器或启用云端账号")
  const bytes = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]") as StoredUser[]
  } catch {
    return []
  }
}

function readRememberedCredentials(): RememberedCredentials {
  try {
    const saved = JSON.parse(localStorage.getItem(AUTH_DRAFT_KEY) || "null") as Partial<RememberedCredentials> | null
    const account = typeof saved?.account === "string" ? saved.account : ""
    if (typeof (saved as { password?: unknown } | null)?.password === "string") {
      localStorage.setItem(AUTH_DRAFT_KEY, JSON.stringify({ account }))
    }
    return { account }
  } catch {
    return { account: "" }
  }
}

function rememberCredentials(credentials: RememberedCredentials) {
  try {
    localStorage.setItem(AUTH_DRAFT_KEY, JSON.stringify(credentials))
  } catch {
    // Keep login functional when browser storage is unavailable.
  }
}

function isValidEmail(account: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)
}

function authErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ""
  if (/invalid login credentials/i.test(message)) return "账号或密码不正确"
  if (/user already registered/i.test(message)) return "该账号已经注册，请直接登录"
  if (/email not confirmed/i.test(message)) return "邮箱尚未验证，请完成验证后再登录"
  if (/invalid email/i.test(message)) return "请输入有效的邮箱地址"
  if (/password.*(weak|at least)|weak password/i.test(message)) return "密码强度不足，请使用至少 6 位字符"
  if (/rate limit|too many requests/i.test(message)) return "操作过于频繁，请稍后再试"
  if (/network|fetch/i.test(message)) return "网络连接失败，请检查网络后重试"
  return message || "账号操作失败，请稍后重试"
}

function AuthDialog({
  cloudClient,
  onSuccess,
  onClose,
  initialMode = "signin",
  initialAccount = "",
}: {
  cloudClient: SupabaseClient | null
  onSuccess: (identity: AuthIdentity) => void
  onClose: () => void
  initialMode?: AuthMode
  initialAccount?: string
}) {
  const isCloudMode = Boolean(cloudClient)
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [account, setAccount] = useState(() => initialAccount || (isCloudMode ? "" : readRememberedCredentials().account))
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError("")
    setNotice("")
    setPassword("")
    setConfirmPassword("")
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setNotice("")
    const normalizedAccount = account.trim().toLowerCase()
    if (mode !== "update" && !normalizedAccount) return setError(mode === "reset" ? "请输入注册邮箱" : "请输入用户名或邮箱")
    if (mode !== "update" && isCloudMode && !isValidEmail(normalizedAccount)) return setError("请输入有效的邮箱地址")
    if (mode === "reset") {
      if (!cloudClient) return setError("本地模式暂不支持邮件找回密码，请联系管理员重置")
      setIsSubmitting(true)
      try {
        await resetPasswordWithCloud(cloudClient, normalizedAccount, `${window.location.origin}/`)
        setNotice("重置密码邮件已发送，请检查你的邮箱。")
      } catch (caught) {
        setError(authErrorMessage(caught))
      } finally {
        setIsSubmitting(false)
      }
      return
    }
    if (password.length < 6) return setError("密码至少需要 6 位")
    if ((mode === "signup" || mode === "update") && password !== confirmPassword) return setError("两次输入的密码不一致")

    setIsSubmitting(true)
    try {
      if (cloudClient) {
        if (mode === "update") {
          const identity = await updatePasswordWithCloud(cloudClient, password)
          onSuccess(identity)
          return
        }
        const identity = mode === "signup"
          ? await signUpWithCloud(cloudClient, normalizedAccount, password, window.location.origin)
          : await signInWithCloud(cloudClient, normalizedAccount, password)
        onSuccess(identity)
        return
      }

      const users = readUsers()
      const existing = users.find((user) => user.account === normalizedAccount)
      const passwordHash = await hashPassword(password)

      if (mode === "signup") {
        if (existing) {
          setError("该账号已经注册，请直接登录")
        } else {
          localStorage.setItem(USERS_KEY, JSON.stringify([...users, { account: normalizedAccount, passwordHash }]))
          localStorage.setItem(SESSION_KEY, normalizedAccount)
          rememberCredentials({ account: normalizedAccount })
          onSuccess({ userId: `local:${normalizedAccount}`, account: normalizedAccount })
        }
      } else if (!existing || existing.passwordHash !== passwordHash) {
        setError("账号或密码不正确")
      } else {
        localStorage.setItem(SESSION_KEY, normalizedAccount)
        rememberCredentials({ account: normalizedAccount })
        onSuccess({ userId: `local:${normalizedAccount}`, account: normalizedAccount })
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : ""
      if (mode === "signup" && /^注册成功/.test(message)) setNotice(message)
      else setError(authErrorMessage(caught))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SignIn2
      account={account}
      confirmPassword={confirmPassword}
      error={error}
      isSubmitting={isSubmitting}
      mode={mode}
      notice={notice}
      onAccountChange={setAccount}
      onClose={onClose}
      onConfirmPasswordChange={setConfirmPassword}
      onModeChange={switchMode}
      onPasswordChange={setPassword}
      onSubmit={submit}
      password={password}
    />
  )
}

function SignedInWorkspace({ account, userId }: { account: string; userId: string }) {
  const sync = useCloudSync()
  const [workbenchLoaded, setWorkbenchLoaded] = useState(false)

  return (
    <main aria-label="Signed-in workspace" className={`signed-in-shell ${workbenchLoaded ? "is-loaded" : "is-loading"}`} data-sync-status={sync.status}>
      <iframe
        className="signed-in-workbench"
        title="教师工作台"
        src={`/教师工作台.html?account=${encodeURIComponent(account)}`}
        data-user-id={userId}
        onLoad={() => setWorkbenchLoaded(true)}
      />
      {(sync.status === "loading" || !workbenchLoaded) && (
        <div className="workbench-loading" data-testid="workbench-loading" role="status" aria-label="正在打开工作台">
          <div className="workbench-loading__panel">
            <span className="workbench-loading__eyebrow">SWP / WORKSPACE</span>
            <span className="workbench-loading__title">正在打开工作台</span>
            <span className="workbench-loading__line" aria-hidden="true"><i /></span>
          </div>
        </div>
      )}
    </main>
  )
}

export default function App() {
  const configuredCloudClient = getSupabaseClient()
  const [cloudClient, setCloudClient] = useState(configuredCloudClient)
  const [account, setAccount] = useState(() => (configuredCloudClient ? "" : readSessionAccount()))
  const [identity, setIdentity] = useState<AuthIdentity | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(() => Boolean(account))
  const [authReady, setAuthReady] = useState(() => !configuredCloudClient)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    if (!cloudClient) return

    let active = true
    const switchToLocalFallback = () => {
      if (!active) return
      const localAccount = readSessionAccount()
      setCloudClient(null)
      setAccount(localAccount)
      setIdentity(localAccount ? { userId: `local:${localAccount}`, account: localAccount } : null)
      setIsSignedIn(Boolean(localAccount))
      setAuthReady(true)
    }
    const timeout = window.setTimeout(() => {
      switchToLocalFallback()
    }, 8000)
    const completeAuthRestore = (nextIdentity: AuthIdentity | null) => {
      if (!active) return
      window.clearTimeout(timeout)
      setIdentity(nextIdentity)
      setAccount(nextIdentity?.account || "")
      setIsSignedIn(Boolean(nextIdentity))
      setAuthReady(true)
    }

    void cloudClient.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      completeAuthRestore(user?.email ? { userId: user.id, account: user.email.trim().toLowerCase() } : null)
    }).catch(() => {
      window.clearTimeout(timeout)
      switchToLocalFallback()
    })

    const { data: authState } = cloudClient.auth.onAuthStateChange((event, session) => {
      const user = session?.user
      if (event === "PASSWORD_RECOVERY" && user?.email) {
        const nextIdentity = { userId: user.id, account: user.email.trim().toLowerCase() }
        window.clearTimeout(timeout)
        setIdentity(nextIdentity)
        setAccount(nextIdentity.account)
        setIsSignedIn(false)
        setIsPasswordRecovery(true)
        setIsAuthOpen(true)
        setAuthReady(true)
        return
      }
      completeAuthRestore(user?.email ? { userId: user.id, account: user.email.trim().toLowerCase() } : null)
    })

    return () => {
      active = false
      window.clearTimeout(timeout)
      authState.subscription.unsubscribe()
    }
  }, [cloudClient])

  useEffect(() => {
    if (!isAuthOpen) return
    const handleKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setIsAuthOpen(false)
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isAuthOpen])

  useEffect(() => {
    const handleWorkbenchMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "zhixing:sign-out") return

      void (async () => {
        try {
          if (cloudClient) await signOutCloud(cloudClient)
        } catch {
          // Local sign-out must still complete when the remote request fails.
        }
        localStorage.removeItem(SESSION_KEY)
        setIdentity(null)
        setAccount("")
        setIsSignedIn(false)
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`)
      })()
    }

    window.addEventListener("message", handleWorkbenchMessage)
    return () => window.removeEventListener("message", handleWorkbenchMessage)
  }, [cloudClient])

  if (!authReady) {
    return <main className="signed-in-shell" aria-label="正在恢复登录状态"><div className="auth-loading">正在恢复登录状态…</div></main>
  }

  if (isSignedIn) {
    return (
      <CloudSyncProvider account={account} userId={identity?.userId || ""} cloudClient={cloudClient}>
        <SignedInWorkspace account={account} userId={identity?.userId || ""} />
      </CloudSyncProvider>
    )
  }

  return (
    <main className="relative isolate flex min-h-svh overflow-hidden bg-background text-foreground">
      <SeamlessVideo src={videoUrl} />

      <ClickFireworks />

      <div className="relative z-10 flex min-h-svh w-full flex-col">
        <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 py-[90px] text-center">
          <h1
            className="max-w-7xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-foreground text-balance animate-fade-rise sm:text-7xl md:text-8xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Where <span className="text-muted-foreground">dreams</span> rise
            <br className="hidden sm:block" />{" "}
            <span className="text-muted-foreground">
              through the silence.
            </span>
          </h1>

          <JourneyButton hero onClick={() => setIsAuthOpen(true)} />
        </section>
      </div>
      {isAuthOpen && <AuthDialog cloudClient={cloudClient} initialMode={isPasswordRecovery ? "update" : "signin"} initialAccount={account} onClose={() => { if (!isPasswordRecovery) setIsAuthOpen(false) }} onSuccess={(nextIdentity) => { setIdentity(nextIdentity); setAccount(nextIdentity.account); setIsPasswordRecovery(false); setIsSignedIn(true); setIsAuthOpen(false) }} />}
    </main>
  )
}
