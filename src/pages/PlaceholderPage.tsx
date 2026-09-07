import { getRouteTitle } from "@/app/routes"
import type { AppRoute } from "@/types/education"

export function PlaceholderPage({ route }: { route: AppRoute }) {
  return (
    <section className="flex min-h-[24rem] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold text-white">{getRouteTitle(route)}</h1>
      <p className="mt-3 text-sm text-white/55">该模块将在后续版本开放</p>
    </section>
  )
}
