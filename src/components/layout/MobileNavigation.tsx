import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { navigationItems, routeToHash } from "@/app/routes"
import type { AppRoute } from "@/types/education"

type MobileNavigationProps = {
  route: AppRoute
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (route: AppRoute) => void
}

export function MobileNavigation({ route, open, onOpenChange, onNavigate }: MobileNavigationProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(88vw,22rem)] border-white/10 bg-[#11191f] text-white">
        <SheetHeader className="border-b border-white/10 pb-5">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base text-white">星河班务</SheetTitle>
            <SheetClose render={<Button variant="ghost" size="icon" aria-label="关闭导航" />}>
              <X data-icon="inline-start" />
            </SheetClose>
          </div>
        </SheetHeader>
        <nav aria-label="移动端教师工作台导航" className="flex flex-col gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = route === item.route
            return (
              <a
                key={item.route}
                href={routeToHash(item.route)}
                aria-label={item.visibleLabel ?? item.label}
                aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate(item.route)
                  onOpenChange(false)
                }}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${active ? "bg-white text-slate-900" : "text-white/60 hover:bg-white/[0.07] hover:text-white"}`}
              >
                <Icon data-icon="inline-start" aria-hidden="true" />
                {item.visibleLabel ?? item.label}
              </a>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
