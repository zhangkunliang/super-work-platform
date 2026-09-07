import { Search, UserRound, CheckSquare2, MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"

export type GlobalSearchResult = {
  id: string
  type: "student" | "todo" | "communication"
  title: string
  description: string
}

type GlobalSearchProps = {
  value: string
  results: GlobalSearchResult[]
  onChange: (value: string) => void
  onSelect: (result: GlobalSearchResult) => void
}

const resultIcons = { student: UserRound, todo: CheckSquare2, communication: MessageCircle }

export function GlobalSearch({ value, results, onChange, onSelect }: GlobalSearchProps) {
  const visibleResults = value.trim() ? results.slice(0, 6) : []
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => setActiveIndex(-1), [value, results.length])

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && visibleResults.length > 0) {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % visibleResults.length)
    } else if (event.key === "ArrowUp" && visibleResults.length > 0) {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + visibleResults.length) % visibleResults.length)
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault()
      onSelect(visibleResults[activeIndex])
    } else if (event.key === "Escape") {
      onChange("")
    }
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-white/45" aria-hidden="true" />
      <Input aria-label="全局搜索" value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={handleKeyDown} placeholder="搜索学生、任务或消息" className="h-11 border-white/10 bg-white/[0.06] pl-9 text-sm text-white placeholder:text-white/35 focus-visible:border-white/30 focus-visible:ring-white/20" />
      {visibleResults.length > 0 && <div role="listbox" aria-label="搜索结果" className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-white/10 bg-[#142027]/95 p-1.5 text-white shadow-2xl backdrop-blur-xl">
        {visibleResults.map((result) => {
          const Icon = resultIcons[result.type]
          const resultIndex = visibleResults.indexOf(result)
          return <button key={`${result.type}-${result.id}`} type="button" role="option" aria-selected={activeIndex === resultIndex} onClick={() => onSelect(result)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70"><Icon className="size-4" aria-hidden="true" /></span><span className="min-w-0"><span className="block truncate text-sm font-medium">{result.title}</span><span className="mt-0.5 block truncate text-xs text-white/50">{result.description}</span></span></button>
        })}
      </div>}
      {value.trim() && visibleResults.length === 0 && <div role="status" className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-xl border border-white/10 bg-[#142027]/95 px-4 py-3 text-xs text-white/55 shadow-2xl backdrop-blur-xl">没有找到匹配内容</div>}
    </div>
  )
}
