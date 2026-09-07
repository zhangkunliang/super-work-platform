import { Bell, Menu, Search } from "lucide-react"
import type { RefObject } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Teacher } from "@/types/education"
import { GlobalSearch, type GlobalSearchResult } from "./GlobalSearch"

type TopbarProps = {
  title: string
  teacher: Teacher
  onOpenMobileNav: () => void
  searchValue?: string
  searchResults?: GlobalSearchResult[]
  onSearchChange?: (value: string) => void
  onSelectSearchResult?: (result: GlobalSearchResult) => void
  onOpenNotifications?: () => void
  unreadCount?: number
  mobileNavTriggerRef?: RefObject<HTMLButtonElement | null>
}

export function Topbar({ title, teacher, onOpenMobileNav, searchValue = "", searchResults = [], onSearchChange = () => undefined, onSelectSearchResult = () => undefined, onOpenNotifications = () => undefined, unreadCount = 0, mobileNavTriggerRef }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 border-b border-white/10 bg-black/10 px-4 backdrop-blur-xl sm:px-6 lg:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button ref={mobileNavTriggerRef} variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white lg:hidden" aria-label="打开导航" onClick={onOpenMobileNav}>
          <Menu data-icon="inline-start" />
        </Button>
        <div className="hidden w-full max-w-sm sm:block"><GlobalSearch value={searchValue} results={searchResults} onChange={onSearchChange} onSelect={onSelectSearchResult} /></div>
        <div className="min-w-0 sm:hidden"><p className="truncate text-base font-semibold text-white">{title}</p></div>
        <p className="hidden truncate text-sm font-medium text-white/80 lg:block">{title}</p>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" className="text-white/70 hover:bg-white/10 hover:text-white sm:hidden" aria-label="搜索"><Search data-icon="inline-start" /></Button>
        <Button variant="ghost" size="icon" className="relative text-white/70 hover:bg-white/10 hover:text-white" aria-label="通知" onClick={onOpenNotifications}><Bell data-icon="inline-start" />{unreadCount > 0 && <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-orange-400 text-xs font-semibold text-background">{unreadCount > 9 ? "9+" : unreadCount}</span>}</Button>
        <div className="ml-1 flex items-center gap-2 border-l border-white/10 pl-2 sm:ml-2 sm:pl-3">
          <Avatar className="size-9 border border-white/15 bg-white/10">
            <AvatarFallback className="bg-white/10 text-xs text-white">{teacher.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block"><p className="text-sm font-semibold text-white">{teacher.name}</p><p className="text-xs text-white/45">{teacher.schoolName ?? "教师工作台"}</p></div>
        </div>
      </div>
    </header>
  )
}
