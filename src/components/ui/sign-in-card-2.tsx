import { useState, type MouseEvent } from "react"
import { ArrowRight, Eye, EyeOff, Lock, Mail, X } from "lucide-react"

import { Button } from "@/components/ui/button"

type SignInCardProps = {
  onClose: () => void
  onSuccess: () => void
}

export function SignInCard({ onClose, onSuccess }: SignInCardProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = bounds.width ? (event.clientX - bounds.left) / bounds.width - 0.5 : 0
    const y = bounds.height ? (event.clientY - bounds.top) / bounds.height - 0.5 : 0
    setTilt({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    window.setTimeout(() => {
      setIsLoading(false)
      onSuccess()
    }, 900)
  }

  return (
    <div
      className="signin-backdrop fixed inset-0 z-50 flex items-center justify-center px-5 py-8"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        data-testid="signin-background-glow"
        className="signin-background-glow absolute inset-0"
        aria-hidden="true"
      />
      <div
        data-testid="signin-light-beam"
        className="signin-light-beam pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div
        aria-labelledby="signin-title"
        aria-modal="true"
        className="signin-card relative w-full max-w-[380px] overflow-hidden rounded-2xl border border-white/15 bg-black/55 p-6 text-white shadow-2xl backdrop-blur-2xl sm:p-7"
        role="dialog"
        onMouseMove={handleMouseMove}
        onPointerMove={handleMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{ transform: `perspective(1200px) rotateX(${tilt.y * -5}deg) rotateY(${tilt.x * 5}deg)` }}
      >
        <span aria-hidden="true" className="signin-border-orbit" />
        <span aria-hidden="true" className="signin-border-core" />
        <span aria-hidden="true" className="signin-card-sheen" />
        <button
          aria-label="Close sign in"
          className="absolute right-4 top-4 rounded-full p-2 text-white/45 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" data-icon="inline-start" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-semibold shadow-inner shadow-white/10">
            S
          </div>
          <h2 id="signin-title" className="font-serif text-3xl text-white">
            Welcome Back
          </h2>
          <p className="mt-1 text-xs text-white/55">Sign in to continue your journey</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-xs text-white/65">
            Email address
            <span className="relative">
              <Mail aria-hidden="true" className="signin-field-icon absolute left-3 top-1/2 -translate-y-1/2 text-white/80" />
              <input
                aria-label="Email address"
                autoComplete="email"
                className="signin-input h-11 w-full rounded-lg border border-white/10 bg-white/[0.07] pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/30"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
            </span>
          </label>

          <label className="flex flex-col gap-2 text-xs text-white/65">
            Password
            <span className="relative">
              <Lock aria-hidden="true" className="signin-field-icon absolute left-3 top-1/2 -translate-y-1/2 text-white/80" />
              <input
                aria-label="Password"
                autoComplete="current-password"
                className="signin-input h-11 w-full rounded-lg border border-white/10 bg-white/[0.07] pl-10 pr-11 text-sm text-white outline-none placeholder:text-white/30"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </span>
          </label>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-white/55">
              <input checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} type="checkbox" />
              Remember me
            </label>
            <a className="text-white/60 underline-offset-4 hover:text-white hover:underline" href="#forgot-password">
              Forgot password?
            </a>
          </div>

          <Button className="signin-primary mt-2 h-11 rounded-lg bg-white text-sm text-black hover:bg-white/90" disabled={isLoading} type="submit">
            {isLoading ? "Signing in" : "Sign In"}
            {!isLoading && <ArrowRight aria-hidden="true" data-icon="inline-end" />}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[11px] text-white/35">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <Button className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.06] text-xs text-white/75 hover:bg-white/10 hover:text-white" type="button">
          <span aria-hidden="true" className="font-semibold">G</span>
          Sign in with Google
        </Button>

        <p className="mt-5 text-center text-xs text-white/50">
          Don&apos;t have an account? <a className="font-medium text-white hover:underline" href="#signup">Sign up</a>
        </p>
      </div>
    </div>
  )
}
