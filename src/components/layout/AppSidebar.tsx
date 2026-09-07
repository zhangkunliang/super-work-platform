import { GraduationCap } from "lucide-react"

import type { AppRoute, ClassGroup } from "@/types/education"
import { navigationItems, routeToHash } from "@/app/routes"

type AppSidebarProps = {
  route: AppRoute
  onNavigate: (route: AppRoute) => void
  classes?: ClassGroup[]
  selectedClassId?: string
  onClassChange?: (classId: string) => void
  onOpenHelp?: () => void
}

export function AppSidebar({ route, onNavigate, classes = [], selectedClassId = "", onClassChange = () => undefined, onOpenHelp = () => undefined }: AppSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-black/20 lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-white text-slate-900"><GraduationCap className="size-5" aria-hidden="true" /></div>
        <div>
          <a href="#workbench" className="text-base font-semibold tracking-tight text-white">星河班务</a>
          {classes.length > 0 ? <label className="mt-1 block"><span className="sr-only">当前班级</span><select aria-label="当前班级" value={selectedClassId} onChange={(event) => onClassChange(event.target.value)} className="max-w-40 truncate bg-transparent text-xs text-white/50 outline-none"><option className="bg-slate-900" value="">选择班级</option>{classes.map((item) => <option className="bg-slate-900" key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <p className="mt-0.5 text-xs text-white/50">{"七年级 2 班"}</p>}
        </div>
      </div>
      <nav aria-label="教师工作台主导航" className="flex flex-1 flex-col gap-1 p-4">
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
              }}
              className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${active ? "bg-white/10 text-white shadow-sm" : "text-white/55 hover:bg-white/[0.07] hover:text-white"}`}
            >
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white text-slate-900" : "text-white/60 group-hover:text-white"}`}>
                <Icon data-icon="inline-start" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span>{item.visibleLabel ?? item.label}</span>
              </span>
            </a>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-4"><button type="button" onClick={onOpenHelp} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-xs text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white">使用帮助</button><p className="mt-2 text-xs text-white/30">数据将由服务端统一保存</p></div>
    </aside>
  )
}
