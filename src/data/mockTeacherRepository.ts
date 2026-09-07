import { getWorkbenchSnapshot } from "@/mocks/workbench"
import type { WorkbenchSnapshot } from "@/types/education"
import type {
  AssignmentItem,
  AssignmentPage,
  AssignmentQuery,
  AttendanceQuery,
  AttendanceRecord,
  AttendanceRecordInput,
  AttendanceSummary,
  CommunicationPage,
  CommunicationQuery,
  CommunicationRecord,
  CreateAssignmentInput,
  CreateCommunicationInput,
  CreateScheduleInput,
  CreateTodoInput,
  LessonPlan,
  LessonPlanPage,
  LessonPlanQuery,
  OverviewQuery,
  ReminderResult,
  SchedulePage,
  ScheduleQuery,
  SaveAttendanceInput,
  ScheduleItem,
  StudentDetail,
  StudentPage,
  StudentQuery,
  TeacherSettings,
  TodoItem,
  TodoPage,
  TodoQuery,
  UpdateLessonPlanInput,
  UpdateScheduleInput,
  UpdateStudentInput,
  UpdateTeacherSettingsInput,
  UpdateTodoInput,
  WorkbenchContext,
  WorkbenchOverview,
} from "@/domain/workbench/models"
import type { TeacherRepository } from "./teacherRepository"

type MockState = {
  snapshot: WorkbenchSnapshot
  students: StudentDetail[]
  attendance: Record<string, AttendanceSummary>
  communications: CommunicationRecord[]
  lessonPlans: LessonPlan[]
  settings: TeacherSettings
  nextId: number
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function createAttendance(snapshot: WorkbenchSnapshot): Record<string, AttendanceSummary> {
  return Object.fromEntries(snapshot.classes.map((classGroup) => {
    const students = snapshot.students.filter((student) => student.classId === classGroup.id)
    const records: AttendanceRecord[] = students.map((student, index) => ({
      studentId: student.id,
      studentName: student.name,
      status: index === 0 ? "absent" : "present",
      reason: null,
    }))
    const absent = records.filter((record) => record.status === "absent").length
    return [classGroup.id, { classId: classGroup.id, date: "2026-09-04", total: classGroup.studentCount, present: Math.max(0, classGroup.studentCount - absent), late: 0, absent, leave: 0, records }]
  }))
}

function createStudents(snapshot: WorkbenchSnapshot): StudentDetail[] {
  return snapshot.students.map((student, index) => ({
    ...student,
    gender: index % 2 === 0 ? "female" : "male",
    phone: null,
    guardianName: `${student.name}家长`,
    guardianPhone: null,
    address: null,
    tags: student.attendanceRate < 95 ? ["考勤关注"] : [],
    notes: [...student.recentNotes],
    attendance: [],
  }))
}

function createLessonPlans(snapshot: WorkbenchSnapshot): LessonPlan[] {
  return [{
    id: "lesson-plan-1",
    classId: snapshot.selectedClassId,
    subject: "语文",
    title: "古诗文阅读方法",
    date: "2026-09-04",
    period: "第 2 节",
    objective: "掌握古诗文阅读的基本方法。",
    keyPoints: "意象理解与情感分析",
    materials: "课本、投影课件",
    reflection: "",
    steps: [
      { id: "step-1", title: "导入", durationMinutes: 5, teacherActivity: "展示诗句并提问", studentActivity: "朗读并分享初步感受" },
      { id: "step-2", title: "精读", durationMinutes: 25, teacherActivity: "引导分析意象", studentActivity: "圈画关键词并完成批注" },
    ],
    updatedAt: "2026-09-04T07:30:00+08:00",
  }]
}

function createState(): MockState {
  const snapshot = getWorkbenchSnapshot()
  return {
    snapshot,
    students: createStudents(snapshot),
    attendance: createAttendance(snapshot),
    communications: [
      { id: "communication-1", classId: "class-1", studentId: "student-1", studentName: "陈同学", senderName: "陈同学家长", content: "老师您好，想了解一下孩子最近的课堂状态。", status: "unread", createdAt: "2026-09-04T09:10:00+08:00" },
    ],
    lessonPlans: createLessonPlans(snapshot),
    settings: { teacherName: snapshot.teacher.name, schoolName: snapshot.teacher.schoolName ?? "", notificationEmail: true, reduceMotion: false, sidebarCollapsed: false },
    nextId: 1,
  }
}

function toAttendanceSummary(state: MockState, input: AttendanceQuery, records: AttendanceRecord[]): AttendanceSummary {
  const base = state.attendance[input.classId] ?? { classId: input.classId, date: input.date, total: 0, present: 0, late: 0, absent: 0, leave: 0, records: [] }
  const counts = records.reduce((result, record) => {
    result[record.status] += 1
    return result
  }, { present: 0, late: 0, absent: 0, leave: 0 } as Record<"present" | "late" | "absent" | "leave", number>)
  return { ...base, date: input.date, ...counts, records }
}

function page<T>(items: T[], query: { page: number; pageSize: number }): { items: T[]; total: number; page: number; pageSize: number } {
  const start = (query.page - 1) * query.pageSize
  return { items: clone(items.slice(start, start + query.pageSize)), total: items.length, page: query.page, pageSize: query.pageSize }
}

export function createMockTeacherRepository(): TeacherRepository {
  const state = createState()
  const findStudent = (id: string) => state.students.find((student) => student.id === id)
  const findSchedule = (id: string) => state.snapshot.schedule.find((item) => item.id === id)
  const findAssignment = (id: string) => state.snapshot.assignments.find((item) => item.id === id)

  return {
    async getWorkbenchContext(): Promise<WorkbenchContext> {
      return clone({ teacher: state.snapshot.teacher, classes: state.snapshot.classes, selectedClassId: state.snapshot.selectedClassId })
    },
    async getOverview(input: OverviewQuery): Promise<WorkbenchOverview> {
      const students = state.snapshot.students.filter((student) => student.classId === input.classId)
      return clone({ classId: input.classId, date: input.date, classMetrics: state.snapshot.classMetrics[input.classId] ?? { attendanceRate: 0, assignmentCompletionRate: 0, attentionCount: 0 }, students, todos: state.snapshot.todos, attentions: state.snapshot.attentions.filter((attention) => students.some((student) => student.id === attention.studentId)), schedule: state.snapshot.schedule.filter((item) => !item.classId || item.classId === input.classId), assignments: state.snapshot.assignments.filter((item) => item.classId === input.classId), attendance: await this.listAttendance({ classId: input.classId, date: input.date }) })
    },
    async listStudents(input: StudentQuery): Promise<StudentPage> {
      const search = input.search.trim().toLocaleLowerCase()
      const filtered = state.students.filter((student) => student.classId === input.classId && (!search || student.name.toLocaleLowerCase().includes(search) || String(student.seatNumber).includes(search)) && (input.attendance === "all" || (input.attendance === "attention" ? student.attendanceRate < 95 : student.attendanceRate < 95)))
      return clone(page(filtered, input))
    },
    async getStudent(id: string): Promise<StudentDetail> {
      const student = findStudent(id)
      if (!student) throw new Error(`Student ${id} not found`)
      return clone(student)
    },
    async updateStudent(id: string, input: UpdateStudentInput): Promise<StudentDetail> {
      const student = findStudent(id)
      if (!student) throw new Error(`Student ${id} not found`)
      Object.assign(student, input)
      if (input.notes) student.recentNotes = [...input.notes]
      return clone(student)
    },
    async listTodos(input: TodoQuery): Promise<TodoPage> {
      const items = input.status === "all" ? state.snapshot.todos : state.snapshot.todos.filter((todo) => todo.status === input.status)
      return clone({ items, total: items.length })
    },
    async createTodo(input: CreateTodoInput): Promise<TodoItem> {
      const todo: TodoItem = { id: `todo-new-${state.nextId++}`, ...input, status: "todo" }
      state.snapshot.todos.push(todo)
      return clone(todo)
    },
    async updateTodo(id: string, input: UpdateTodoInput): Promise<TodoItem> {
      const todo = state.snapshot.todos.find((item) => item.id === id)
      if (!todo) throw new Error(`Todo ${id} not found`)
      Object.assign(todo, input)
      return clone(todo)
    },
    async listAttendance(input: AttendanceQuery): Promise<AttendanceSummary> {
      const current = state.attendance[input.classId]
      return clone(current ? { ...current, date: input.date } : { classId: input.classId, date: input.date, total: 0, present: 0, late: 0, absent: 0, leave: 0, records: [] })
    },
    async saveAttendance(input: SaveAttendanceInput): Promise<AttendanceSummary> {
      const records = input.records.map((record: AttendanceRecordInput) => ({ ...record, reason: record.reason ?? null, studentName: findStudent(record.studentId)?.name ?? "" }))
      const result = toAttendanceSummary(state, input, records)
      state.attendance[input.classId] = result
      return clone(result)
    },
    async listSchedules(input: ScheduleQuery): Promise<SchedulePage> {
      const items = state.snapshot.schedule.filter((item) => (!item.classId || item.classId === input.classId) && item.startsAt >= input.from && item.startsAt <= input.to)
      return clone({ items, total: items.length })
    },
    async createSchedule(input: CreateScheduleInput): Promise<ScheduleItem> {
      const item: ScheduleItem = { id: `schedule-new-${state.nextId++}`, ...input, status: "upcoming" }
      state.snapshot.schedule.push(item)
      return clone(item)
    },
    async updateSchedule(id: string, input: UpdateScheduleInput): Promise<ScheduleItem> {
      const item = findSchedule(id)
      if (!item) throw new Error(`Schedule ${id} not found`)
      Object.assign(item, input)
      return clone(item)
    },
    async deleteSchedule(id: string): Promise<void> {
      state.snapshot.schedule = state.snapshot.schedule.filter((item) => item.id !== id)
    },
    async listAssignments(input: AssignmentQuery): Promise<AssignmentPage> {
      const search = input.search?.trim().toLocaleLowerCase() ?? ""
      const items = state.snapshot.assignments.filter((item) => item.classId === input.classId && (!search || item.title.toLocaleLowerCase().includes(search)) && (!input.status || input.status === "all" || item.status === input.status))
      return clone(page(items, input))
    },
    async createAssignment(input: CreateAssignmentInput): Promise<AssignmentItem> {
      const item: AssignmentItem = { id: `assignment-new-${state.nextId++}`, ...input, status: input.status ?? "draft", submittedCount: 0, totalCount: state.snapshot.classes.find((classGroup) => classGroup.id === input.classId)?.studentCount ?? 0, unsubmittedStudentIds: [] }
      state.snapshot.assignments.push(item)
      return clone(item)
    },
    async remindAssignment(id: string): Promise<ReminderResult> {
      const assignment = findAssignment(id)
      if (!assignment) throw new Error(`Assignment ${id} not found`)
      return { assignmentId: id, targetCount: assignment.totalCount - assignment.submittedCount, sentAt: "2026-09-04T10:00:00+08:00" }
    },
    async listCommunications(input: CommunicationQuery): Promise<CommunicationPage> {
      const items = state.communications.filter((item) => item.classId === input.classId && (!input.status || input.status === "all" || item.status === input.status))
      return clone({ items, total: items.length, unreadCount: state.communications.filter((item) => item.classId === input.classId && item.status === "unread").length })
    },
    async createCommunication(input: CreateCommunicationInput): Promise<CommunicationRecord> {
      const student = findStudent(input.studentId)
      const item: CommunicationRecord = { id: `communication-new-${state.nextId++}`, ...input, studentName: student?.name ?? "", senderName: state.snapshot.teacher.name, status: "resolved", createdAt: "2026-09-04T10:00:00+08:00" }
      state.communications.unshift(item)
      return clone(item)
    },
    async resolveCommunication(id: string): Promise<CommunicationRecord> {
      const item = state.communications.find((record) => record.id === id)
      if (!item) throw new Error(`Communication ${id} not found`)
      item.status = "resolved"
      return clone(item)
    },
    async listLessonPlans(input: LessonPlanQuery): Promise<LessonPlanPage> {
      const search = input.search?.trim().toLocaleLowerCase() ?? ""
      const items = state.lessonPlans.filter((plan) => plan.classId === input.classId && (!search || plan.title.toLocaleLowerCase().includes(search) || plan.subject.toLocaleLowerCase().includes(search)))
      return clone({ items, total: items.length })
    },
    async updateLessonPlan(id: string, input: UpdateLessonPlanInput): Promise<LessonPlan> {
      const plan = state.lessonPlans.find((item) => item.id === id)
      if (!plan) throw new Error(`Lesson plan ${id} not found`)
      Object.assign(plan, input, { updatedAt: "2026-09-04T10:00:00+08:00" })
      return clone(plan)
    },
    async copyLessonPlan(id: string): Promise<LessonPlan> {
      const plan = state.lessonPlans.find((item) => item.id === id)
      if (!plan) throw new Error(`Lesson plan ${id} not found`)
      const copy = clone({ ...plan, id: `lesson-plan-copy-${state.nextId++}`, title: `${plan.title}（副本）`, updatedAt: "2026-09-04T10:00:00+08:00" })
      state.lessonPlans.push(copy)
      return clone(copy)
    },
    async getTeacherSettings(): Promise<TeacherSettings> {
      return clone(state.settings)
    },
    async updateTeacherSettings(input: UpdateTeacherSettingsInput): Promise<TeacherSettings> {
      Object.assign(state.settings, input)
      return clone(state.settings)
    },
  }
}
