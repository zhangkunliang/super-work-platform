import { createContext, forwardRef, useContext, type HTMLAttributes, type ReactNode } from "react"

import { cn } from "@/lib/utils"

const AvatarContext = createContext<{ sizeClass: string }>({ sizeClass: "size-8" })

type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  children?: ReactNode
}

const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(({ className, children, ...props }, ref) => (
  <AvatarContext.Provider value={{ sizeClass: "size-full" }}>
    <span ref={ref} data-slot="avatar" className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)} {...props}>
      {children}
    </span>
  </AvatarContext.Provider>
))

Avatar.displayName = "Avatar"

const AvatarFallback = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(({ className, ...props }, ref) => {
  const { sizeClass } = useContext(AvatarContext)
  return <span ref={ref} data-slot="avatar-fallback" className={cn("flex items-center justify-center rounded-full bg-muted", sizeClass, className)} {...props} />
})

AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback }
