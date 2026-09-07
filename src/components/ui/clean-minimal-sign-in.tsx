"use client"

import type { FormEvent } from "react"
import { Lock, LogIn, Mail, X } from "lucide-react"

export type AuthMode = "signin" | "signup" | "reset" | "update"

type SignIn2Props = {
  mode: AuthMode
  account: string
  password: string
  confirmPassword: string
  error: string
  notice: string
  isSubmitting: boolean
  onAccountChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onModeChange: (mode: AuthMode) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
}

const contentByMode: Record<AuthMode, { title: string; description: string }> = {
  signin: {
    title: "Sign in with email",
    description: "登录后继续使用你的教师工作台。",
  },
  signup: {
    title: "Create your account",
    description: "注册一个账号，保存属于你的教学资料。",
  },
  reset: {
    title: "Reset your password",
    description: "输入注册邮箱，我们会发送重置链接。",
  },
  update: {
    title: "Set a new password",
    description: "请设置一个新的登录密码。",
  },
}

export function SignIn2({
  mode,
  account,
  password,
  confirmPassword,
  error,
  notice,
  isSubmitting,
  onAccountChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onModeChange,
  onSubmit,
  onClose,
}: SignIn2Props) {
  const content = contentByMode[mode]
  const showAccount = mode !== "update"
  const showPassword = mode !== "reset"
  const showConfirmation = mode === "signup" || mode === "update"

  return (
    <div
      className="clean-auth-backdrop fixed inset-0 z-50 flex min-h-svh items-center justify-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-sm sm:px-6"
      data-testid="auth-background"
      data-theme="clean-light"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="auth-title"
        aria-modal="true"
        className="clean-auth-card relative flex max-h-[calc(100svh-3rem)] w-full max-w-sm flex-col items-center overflow-y-auto rounded-3xl border bg-white bg-gradient-to-b from-sky-50/50 to-white p-6 text-black shadow-xl sm:p-8"
        role="dialog"
      >
        {mode !== "update" && (
          <button
            aria-label="关闭登录窗口"
            className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}

        <div className="mb-6 flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg shadow-black/5">
          <LogIn aria-hidden="true" className="size-7 text-black" />
        </div>

        <div className="clean-auth-copy w-full" key={mode}>
          <h2 id="auth-title" className="mb-2 text-center text-2xl font-semibold text-black">
            {content.title}
          </h2>
          <p className="mb-6 text-center text-sm leading-6 text-gray-500">{content.description}</p>
        </div>

        {mode !== "reset" && mode !== "update" && (
          <div className="relative mb-4 grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1" role="tablist" aria-label="账号操作">
            <span
              aria-hidden="true"
              className="clean-auth-tab-indicator"
              data-active-mode={mode}
              data-testid="auth-tab-indicator"
            />
            <button
              aria-selected={mode === "signin"}
              className={`relative z-10 min-h-9 rounded-lg text-sm font-medium transition-[color,transform] duration-200 ease-out active:scale-[0.98] ${mode === "signin" ? "text-black" : "text-gray-500 hover:text-black"}`}
              onClick={() => onModeChange("signin")}
              role="tab"
              type="button"
            >
              登录
            </button>
            <button
              aria-selected={mode === "signup"}
              className={`relative z-10 min-h-9 rounded-lg text-sm font-medium transition-[color,transform] duration-200 ease-out active:scale-[0.98] ${mode === "signup" ? "text-black" : "text-gray-500 hover:text-black"}`}
              onClick={() => onModeChange("signup")}
              role="tab"
              type="button"
            >
              注册
            </button>
          </div>
        )}

        <form className="clean-auth-form flex w-full flex-col gap-3" key={`form-${mode}`} onSubmit={onSubmit}>
          {showAccount && (
            <label className="relative block">
              <span className="sr-only">{mode === "reset" ? "注册邮箱" : "用户名或邮箱"}</span>
              <Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                aria-invalid={Boolean(error)}
                aria-label={mode === "reset" ? "注册邮箱" : "用户名或邮箱"}
                autoComplete={mode === "reset" ? "email" : "username"}
                autoFocus
                className="clean-auth-input min-h-11 w-full rounded-xl border bg-gray-50 py-2 pl-10 pr-3 text-sm text-black transition"
                onChange={(event) => onAccountChange(event.target.value)}
                placeholder={mode === "reset" ? "注册邮箱" : "Email"}
                type={mode === "reset" ? "email" : "text"}
                value={account}
              />
            </label>
          )}

          {showPassword && (
            <label className="relative block">
              <span className="sr-only">{mode === "update" ? "新密码" : "密码"}</span>
              <Lock aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                aria-invalid={Boolean(error)}
                aria-label={mode === "update" ? "新密码" : "密码"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                autoFocus={mode === "update"}
                className="clean-auth-input min-h-11 w-full rounded-xl border bg-gray-50 py-2 pl-10 pr-3 text-sm text-black transition"
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder={mode === "update" ? "New password" : "Password"}
                type="password"
                value={password}
              />
            </label>
          )}

          {showConfirmation && (
            <label className="relative block">
              <span className="sr-only">{mode === "update" ? "确认新密码" : "再次输入密码"}</span>
              <Lock aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                aria-invalid={Boolean(error)}
                aria-label={mode === "update" ? "确认新密码" : "再次输入密码"}
                autoComplete="new-password"
                className="clean-auth-input min-h-11 w-full rounded-xl border bg-gray-50 py-2 pl-10 pr-3 text-sm text-black transition"
                onChange={(event) => onConfirmPasswordChange(event.target.value)}
                placeholder="Confirm password"
                type="password"
                value={confirmPassword}
              />
            </label>
          )}

          {mode === "signin" && (
            <div className="flex w-full justify-end">
              <button className="text-xs font-medium text-gray-700 hover:underline" onClick={() => onModeChange("reset")} type="button">
                忘记密码？
              </button>
            </div>
          )}

          {error && <p className="text-left text-sm text-red-600" role="alert">{error}</p>}
          {notice && <p className="text-left text-sm text-gray-600" role="status">{notice}</p>}

          <button
            className="clean-auth-submit mt-2 min-h-11 w-full rounded-xl bg-gradient-to-b from-gray-700 to-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-[transform,filter,box-shadow] duration-150 ease-out hover:brightness-105 active:scale-[0.985] active:shadow-none disabled:cursor-wait disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "处理中…" : mode === "signin" ? "登录并进入工作台" : mode === "signup" ? "注册并进入工作台" : mode === "reset" ? "发送重置邮件" : "更新密码并进入工作台"}
          </button>
        </form>

        {mode === "reset" && (
          <button className="mt-4 text-xs font-medium text-gray-700 hover:underline" onClick={() => onModeChange("signin")} type="button">
            返回登录
          </button>
        )}
      </section>
    </div>
  )
}
