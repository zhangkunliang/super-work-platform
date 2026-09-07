import { CircleHelp, Keyboard, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type HelpSheetProps = { open: boolean; onOpenChange: (open: boolean) => void }

const helpGroups = [
  { title: "班级总览", text: "查看今日班务、考勤摘要和需要关注的学生。" },
  { title: "今日任务", text: "创建、完成或恢复需要推进的班级工作。" },
  { title: "学生档案", text: "搜索学生，打开详情并记录后续跟进。" },
  { title: "课程与值日", text: "按日或周查看课程安排，快速编辑日程。" },
  { title: "备课中心", text: "维护教案、课堂流程和课后反思。" },
  { title: "家校沟通", text: "记录家长沟通，并及时处理未读消息。" },
  { title: "数据周报", text: "查看班级趋势，并从指标进入明细。" },
  { title: "系统设置", text: "管理教师资料和工作台偏好。" },
]

export function HelpSheet({ open, onOpenChange }: HelpSheetProps) {
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="w-[min(92vw,28rem)] border-white/10 bg-[#101b21] text-white"><SheetHeader className="border-b border-white/10 pb-5"><div className="flex items-start justify-between gap-4"><div><SheetTitle className="flex items-center gap-2 text-white"><CircleHelp className="size-4 text-white/70" aria-hidden="true" />使用帮助</SheetTitle><SheetDescription className="mt-1 text-white/50">快速了解工作台的主要入口</SheetDescription></div><SheetClose render={<Button variant="ghost" size="icon" aria-label="关闭帮助" className="text-white/60 hover:bg-white/10 hover:text-white" />}><X data-icon="inline-start" /></SheetClose></div></SheetHeader><div className="flex flex-col gap-3 overflow-y-auto py-5">{helpGroups.map((group) => <div key={group.title} className="rounded-xl border border-white/10 bg-white/[0.05] p-4"><h2 className="text-sm font-medium text-white">{group.title}</h2><p className="mt-1 text-xs leading-relaxed text-white/55">{group.text}</p></div>)}<div className="mt-2 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"><Keyboard className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden="true" /><p className="text-xs leading-relaxed text-white/55">使用顶部搜索可以快速定位学生、待办和沟通记录。</p></div></div></SheetContent></Sheet>
}
