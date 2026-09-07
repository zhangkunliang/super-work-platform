import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react"
import { parseRoute, routeToHash } from "./routes"
import type { AppRoute } from "@/types/education"

export type WorkbenchUiState = {
  route: AppRoute
  selectedClassId: string
  searchQuery: string
  mobileNavOpen: boolean
  helpOpen: boolean
  notificationOpen: boolean
}

export type WorkbenchUiAction =
  | { type: "navigate"; route: AppRoute }
  | { type: "sync-route"; route: AppRoute }
  | { type: "select-class"; classId: string }
  | { type: "set-search"; query: string }
  | { type: "toggle-mobile-nav"; open: boolean }
  | { type: "toggle-help"; open: boolean }
  | { type: "toggle-notifications"; open: boolean }

export const initialWorkbenchUiState: WorkbenchUiState = {
  route: "landing",
  selectedClassId: "class-1",
  searchQuery: "",
  mobileNavOpen: false,
  helpOpen: false,
  notificationOpen: false,
}

export function createInitialWorkbenchUiState(): WorkbenchUiState {
  return { ...initialWorkbenchUiState, route: typeof window === "undefined" ? "landing" : parseRoute(window.location.hash) }
}

export function workbenchUiReducer(state: WorkbenchUiState, action: WorkbenchUiAction): WorkbenchUiState {
  switch (action.type) {
    case "navigate":
    case "sync-route":
      return { ...state, route: action.route, mobileNavOpen: false }
    case "select-class":
      return { ...state, selectedClassId: action.classId }
    case "set-search":
      return { ...state, searchQuery: action.query }
    case "toggle-mobile-nav":
      return { ...state, mobileNavOpen: action.open }
    case "toggle-help":
      return { ...state, helpOpen: action.open }
    case "toggle-notifications":
      return { ...state, notificationOpen: action.open }
  }
}

type WorkbenchUiContextValue = { state: WorkbenchUiState; dispatch: Dispatch<WorkbenchUiAction> }
const WorkbenchUiContext = createContext<WorkbenchUiContextValue | null>(null)

export function TeacherWorkbenchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workbenchUiReducer, undefined, createInitialWorkbenchUiState)

  useEffect(() => {
    const handleHashChange = () => dispatch({ type: "sync-route", route: parseRoute(window.location.hash) })
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  useEffect(() => {
    const nextHash = routeToHash(state.route)
    if (window.location.hash !== nextHash) window.location.hash = nextHash.slice(1)
  }, [state.route])

  return <WorkbenchUiContext.Provider value={{ state, dispatch }}>{children}</WorkbenchUiContext.Provider>
}

export function useWorkbenchUi(): WorkbenchUiContextValue {
  const context = useContext(WorkbenchUiContext)
  if (!context) throw new Error("TeacherWorkbenchProvider is missing")
  return context
}
