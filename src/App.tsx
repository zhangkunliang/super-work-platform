import { useEffect, useState } from "react"

import { AuthDialog } from "@/features/auth/AuthDialog"
import { AssignmentComposer, type CreateAssignmentInput } from "@/features/assignments/AssignmentComposer"
import type { CreateScheduleInput } from "@/features/schedule/ScheduleComposer"
import { AppShell } from "@/app/AppShell"
import { TeacherWorkbenchProvider, useWorkbenchUi } from "@/app/TeacherWorkbenchProvider"
import { getWorkbenchSnapshot } from "@/mocks/workbench"
import { TeacherDataProvider } from "@/data/provider"
import { WorkbenchPage } from "@/pages/WorkbenchPage"
import { TodoComposer, type CreateTodoInput } from "@/components/workbench/TodoComposer"
import { AttendanceDialog } from "@/components/workbench/AttendanceDialog"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { StudentsPage } from "@/pages/StudentsPage"
import { AssignmentsPage } from "@/pages/AssignmentsPage"
import { SchedulePage } from "@/pages/SchedulePage"
import type { AppRoute, AttendanceStatus } from "@/types/education"
import { LandingPage } from "@/pages/LandingPage"

export default function App() {
  return <TeacherWorkbenchProvider><AppContent /></TeacherWorkbenchProvider>
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const { state: uiState, dispatch } = useWorkbenchUi()
  const { route } = uiState
  const [snapshot] = useState(getWorkbenchSnapshot)
  const [todos, setTodos] = useState(() => snapshot.todos)
  const [todoUndo, setTodoUndo] = useState<(typeof snapshot.todos)[number] | null>(null)
  const [attentions, setAttentions] = useState(() => snapshot.attentions)
  const [todoComposerOpen, setTodoComposerOpen] = useState(false)
  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [attendanceSaved, setAttendanceSaved] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>(() => Object.fromEntries(snapshot.students.map((student) => [student.id, "present"])))
  const [attendanceFeedback, setAttendanceFeedback] = useState("")
  const [schedule, setSchedule] = useState(() => snapshot.schedule)
  const [assignments, setAssignments] = useState(() => snapshot.assignments)
  const [assignmentComposerOpen, setAssignmentComposerOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated || route === "landing") return
    dispatch({ type: "navigate", route: "landing" })
  }, [dispatch, isAuthenticated, route])

  useEffect(() => {
    if (!todoUndo) return

    const timeoutId = window.setTimeout(() => setTodoUndo(null), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [todoUndo])

  function handleAuthenticated() {
    setIsAuthenticated(true)
    setAuthOpen(false)
    dispatch({ type: "navigate", route: "workbench" })
  }

  function handleNavigate(nextRoute: AppRoute) {
    dispatch({ type: "navigate", route: nextRoute })
  }

  function handleCreateTodo(input: CreateTodoInput) {
    const dueAt = input.dueAt ? `2026-09-04T${input.dueAt}:00+08:00` : undefined
    setTodos((current) => [...current, { id: `todo-${Date.now()}`, title: input.title, dueAt, priority: input.priority, status: "todo" }])
  }

  function handleToggleTodo(id: string) {
    const target = todos.find((todo) => todo.id === id)
    if (!target) return

    const nextStatus = target.status === "done" ? "todo" : "done"
    setTodos((current) => current.map((todo) => todo.id === id ? { ...todo, status: nextStatus } : todo))
    setTodoUndo(nextStatus === "done" ? target : null)
  }

  function handleUndoTodo() {
    if (!todoUndo) return

    setTodos((current) => current.map((todo) => todo.id === todoUndo.id ? todoUndo : todo))
    setTodoUndo(null)
  }

  function handleResolveAttention(id: string) {
    setAttentions((current) => current.map((item) => item.id === id ? { ...item, resolved: true } : item))
  }

  function handleSaveAttendance(records: Record<string, AttendanceStatus>) {
    setAttendanceRecords(records)
    setAttendanceSaved(true)
    setAttendanceFeedback("考勤已保存，首页摘要已更新。")
    const absentStudents = snapshot.students.filter((student) => records[student.id] === "absent")
    setAttentions((current) => {
      const next = [...current]
      absentStudents.forEach((student) => {
        const existing = next.some((item) => item.studentId === student.id && item.type === "attendance" && !item.resolved)
        if (!existing) next.push({ id: `attendance-${Date.now()}-${student.id}`, studentId: student.id, studentName: student.name, type: "attendance", title: `${student.name}今日缺勤`, description: "登记考勤显示为缺勤，请及时确认情况。", severity: "high", createdAt: new Date().toISOString(), resolved: false })
      })
      return next
    })
  }

  function handleCreateSchedule(input: CreateScheduleInput) {
    setSchedule((current) => [...current, { id: `schedule-${Date.now()}`, ...input, status: "upcoming" }])
  }

  function handleUpdateSchedule(id: string, changes: Partial<(typeof snapshot.schedule)[number]>) {
    setSchedule((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item))
  }

  function handleCreateAssignment(input: CreateAssignmentInput) {
    const classGroup = snapshot.classes.find((item) => item.id === input.classId) ?? snapshot.classes[0]
    const classStudents = snapshot.students.filter((student) => student.classId === classGroup.id)
    setAssignments((current) => [...current, { id: `assignment-${Date.now()}`, ...input, classId: classGroup.id, className: classGroup.name, submittedCount: 0, totalCount: classStudents.length, unsubmittedStudentIds: classStudents.map((student) => student.id) }])
    setAssignmentComposerOpen(false)
  }

  const liveClassMetrics = Object.fromEntries(snapshot.classes.map((classGroup) => {
    const baseMetrics = snapshot.classMetrics[classGroup.id]
    const classStudents = snapshot.students.filter((student) => student.classId === classGroup.id)
    const absentCount = attendanceSaved ? classStudents.filter((student) => attendanceRecords[student.id] === "absent").length : 0
    return [classGroup.id, { ...baseMetrics, attendanceRate: Math.max(0, baseMetrics.attendanceRate - Math.round((absentCount / classGroup.studentCount) * 100)), attentionCount: attentions.filter((item) => item.studentId && !item.resolved && classStudents.some((student) => student.id === item.studentId)).length }]
  }))
  const liveSnapshot = { ...snapshot, selectedClassId: uiState.selectedClassId, classMetrics: liveClassMetrics, todos, attentions, schedule, assignments }

  const requiresAuthentication = !isAuthenticated && route !== "landing"

  if (isAuthenticated && route !== "landing") {
    return (
      <>
        <TeacherDataProvider teacherId={snapshot.teacher.id}>
          <AppShell route={route} onNavigate={handleNavigate} teacher={snapshot.teacher}>
          {route === "workbench" ? (
            <WorkbenchPage snapshot={liveSnapshot} onCreateTodo={() => setTodoComposerOpen(true)} onOpenStudent={() => undefined} todos={todos} onToggleTodo={handleToggleTodo} todoUndo={todoUndo ?? undefined} onUndoTodo={handleUndoTodo} onOpenAttendance={() => setAttendanceOpen(true)} onCreateAssignment={() => setAssignmentComposerOpen(true)} attendanceFeedback={attendanceFeedback} attentions={attentions} onResolveAttention={handleResolveAttention} />
          ) : route === "schedule" ? (
            <SchedulePage items={schedule} classes={snapshot.classes} onCreate={handleCreateSchedule} onUpdate={handleUpdateSchedule} />
          ) : route === "students" ? (
            <StudentsPage students={snapshot.students} classes={snapshot.classes} attentions={attentions} onOpenStudent={() => undefined} onCreateFollowUp={() => setTodoComposerOpen(true)} />
          ) : route === "assignments" ? (
            <AssignmentsPage assignments={assignments} classes={snapshot.classes} students={snapshot.students} onCreate={handleCreateAssignment} />
          ) : route === "settings" ? (
            <SettingsPage teacher={snapshot.teacher} onSave={() => undefined} />
          ) : (
            <PlaceholderPage route={route} onBack={() => handleNavigate("workbench")} />
          )}
          </AppShell>
        </TeacherDataProvider>
        <TodoComposer open={todoComposerOpen} onOpenChange={setTodoComposerOpen} onSubmit={handleCreateTodo} />
        <AttendanceDialog open={attendanceOpen} students={snapshot.students.filter((student) => student.classId === uiState.selectedClassId)} className={snapshot.classes.find((item) => item.id === uiState.selectedClassId)?.name ?? "当前班级"} onOpenChange={setAttendanceOpen} onSubmit={handleSaveAttendance} />
        <AssignmentComposer key={assignmentComposerOpen ? "open" : "closed"} open={assignmentComposerOpen} onOpenChange={setAssignmentComposerOpen} classes={snapshot.classes} onSubmit={handleCreateAssignment} />
      </>
    )
  }

  return (
    <>
      <LandingPage onBeginJourney={() => setAuthOpen(true)} />
      <AuthDialog open={authOpen || requiresAuthentication} onOpenChange={setAuthOpen} onAuthenticated={handleAuthenticated} />
    </>
  )
}
