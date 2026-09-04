import { Bell, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export type NotificationItem = {
  id: string
  title: string
  description: string
  studentId: string
  studentName: string
  resolved: boolean
}

type NotificationSheetProps = {
  open: boolean
  items: NotificationItem[]
  onOpenChange: (open: boolean) => void
  onResolve: (id: string) => void
  onViewAll?: () => void
}

export function NotificationSheet({ open, items, onOpenChange, onResolve, onViewAll = () => undefined }: NotificationSheetProps) {
  const pendingItems = items.filter((item) => !item.resolved)
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="w-[min(92vw,28rem)] border-white/10 bg-[#101b21] text-white"><SheetHeader className="border-b border-white/10 pb-5"><div className="flex items-start justify-between gap-4"><div><SheetTitle className="flex items-center gap-2 text-white"><Bell className="size-4 text-white/70" aria-hidden="true" />通知</SheetTitle><SheetDescription className="mt-1 text-white/50">需要你确认的学生动态</SheetDescription></div><SheetClose render={<Button variant="ghost" size="icon" aria-label="关闭通知" className="text-white/60 hover:bg-white/10 hover:text-white" />}><X data-icon="inline-start" /></SheetClose></div></SheetHeader><div className="flex flex-1 flex-col gap-3 overflow-y-auto py-5">{pendingItems.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center"><span className="flex size-10 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="size-5" aria-hidden="true" /></span><p className="text-sm text-white/75">暂时没有待处理通知</p></div> : pendingItems.map((item) => <article key={item.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-sm font-medium text-white">{item.title}</h2><p className="mt-1 text-xs leading-relaxed text-white/55">{item.description}</p></div><Badge variant="outline" className="shrink-0 border-orange-300/25 bg-orange-300/10 text-orange-200">待处理</Badge></div><Button variant="ghost" size="sm" className="mt-3 h-9 px-0 text-white/70 hover:bg-transparent hover:text-white" onClick={() => onResolve(item.id)} aria-label={`标记已处理 ${item.title}`}><Check data-icon="inline-start" />标记已处理</Button></article>)}{pendingItems.length > 0 && <Button variant="outline" className="mt-2 border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white" onClick={onViewAll}>查看全部通知</Button>}</div></SheetContent></Sheet>
}
