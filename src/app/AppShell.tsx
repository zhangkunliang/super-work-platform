import type { ReactNode } from "react"
import { useRef, useState } from "react"

import { getRouteTitle } from "@/app/routes"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { MobileNavigation } from "@/components/layout/MobileNavigation"
import { Topbar } from "@/components/layout/Topbar"
import { HelpSheet } from "@/components/layout/HelpSheet"
import { NotificationSheet, type NotificationItem } from "@/components/layout/NotificationSheet"
import type { AppRoute, ClassGroup, Teacher } from "@/types/education"
import type { GlobalSearchResult } from "@/components/layout/GlobalSearch"

type AppShellProps = {
  route: AppRoute
  onNavigate: (route: AppRoute) => void
  teacher: Teacher
  children: ReactNode
  classes?: ClassGroup[]
  selectedClassId?: string
  onClassChange?: (classId: string) => void
  searchValue?: string
  searchResults?: GlobalSearchResult[]
  onSearchChange?: (value: string) => void
  onSelectSearchResult?: (result: GlobalSearchResult) => void
  notifications?: NotificationItem[]
  onResolveNotification?: (id: string) => void
  onViewAllNotifications?: () => void
}

export function AppShell({ route, onNavigate, teacher, children, classes = [], selectedClassId = "", onClassChange = () => undefined, searchValue = "", searchResults = [], onSearchChange = () => undefined, onSelectSearchResult = () => undefined, notifications = [], onResolveNotification = () => undefined, onViewAllNotifications = () => undefined }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null)

  function handleMobileNavChange(open: boolean) {
    setMobileNavOpen(open)
    if (!open) window.requestAnimationFrame(() => mobileNavTriggerRef.current?.focus())
  }

  return (
    <div data-testid="teacher-workbench-stage" className="workbench-stage relative min-h-svh overflow-hidden bg-black text-foreground">
      <video data-testid="teacher-workbench-background" className="pointer-events-none absolute inset-0 size-full object-cover opacity-90" autoPlay loop muted playsInline aria-hidden="true">
        <source src="/backgrounds/cloud-mountain.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden="true" />
      <div data-testid="teacher-workbench-frame" className="relative z-10 mx-auto flex min-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[1480px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-black/25 text-white/90 shadow-2xl backdrop-blur-2xl sm:my-4 sm:min-h-[calc(100dvh-2rem)] lg:my-10 lg:h-[calc(100dvh-5rem)] lg:min-h-[620px] lg:flex-row lg:rounded-[40px]">
        <AppSidebar route={route} onNavigate={onNavigate} classes={classes} selectedClassId={selectedClassId} onClassChange={onClassChange} onOpenHelp={() => setHelpOpen(true)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title={getRouteTitle(route)} teacher={teacher} onOpenMobileNav={() => setMobileNavOpen(true)} mobileNavTriggerRef={mobileNavTriggerRef} searchValue={searchValue} searchResults={searchResults} onSearchChange={onSearchChange} onSelectSearchResult={onSelectSearchResult} onOpenNotifications={() => setNotificationOpen(true)} unreadCount={notifications.filter((item) => !item.resolved).length} />
          <main className="workbench-scrollbar flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-8">{children}</main>
        </div>
      </div>
      <MobileNavigation route={route} open={mobileNavOpen} onOpenChange={handleMobileNavChange} onNavigate={onNavigate} />
      <NotificationSheet open={notificationOpen} items={notifications} onOpenChange={setNotificationOpen} onResolve={onResolveNotification} onViewAll={() => { setNotificationOpen(false); onViewAllNotifications() }} />
      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  )
}
