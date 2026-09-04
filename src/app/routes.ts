import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Settings,
} from "lucide-react"

import type { AppRoute, NavigationItem } from "@/types/education"

export const navigationItems: readonly NavigationItem[] = [
  { route: "workbench", label: "工作台", visibleLabel: "班级总览", description: "今日事项与学生关注", icon: LayoutDashboard, phase: "P0" },
  { route: "assignments", label: "今日任务", visibleLabel: "今日任务", description: "发布与完成情况", icon: ClipboardCheck, phase: "P1" },
  { route: "students", label: "学生档案", visibleLabel: "学生档案", description: "档案与关注记录", icon: GraduationCap, phase: "P1" },
  { route: "schedule", label: "课程与值日", visibleLabel: "课程与值日", description: "课程与个人安排", icon: CalendarDays, phase: "P1" },
  { route: "materials", label: "备课中心", visibleLabel: "备课中心", description: "教案与教学素材", icon: BookOpen, phase: "P2" },
  { route: "communication", label: "家校沟通", visibleLabel: "家校沟通", description: "通知与沟通记录", icon: MessageCircle, phase: "P2" },
  { route: "grades", label: "数据周报", visibleLabel: "数据周报", description: "成绩录入与趋势", icon: FileText, phase: "P2" },
  { route: "settings", label: "系统设置", visibleLabel: "系统设置", description: "资料与工作台偏好", icon: Settings, phase: "P1" },
]

const routeSet = new Set<AppRoute>([
  "landing",
  "workbench",
  "schedule",
  "students",
  "assignments",
  "grades",
  "communication",
  "materials",
  "settings",
])

export function parseRoute(hash: string): AppRoute {
  const value = hash.replace(/^#/, "").replace(/^\//, "")
  if (!value || value === "home" || value === "landing") return "landing"
  return routeSet.has(value as AppRoute) ? (value as AppRoute) : "landing"
}

export function routeToHash(route: AppRoute): string {
  return route === "landing" ? "#home" : `#${route}`
}

export function getRouteTitle(route: AppRoute): string {
  if (route === "landing") return "Velorah"
  return navigationItems.find((item) => item.route === route)?.visibleLabel ?? "工作台"
}
