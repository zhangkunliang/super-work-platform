import type { CreateAssignmentInput, CreateScheduleInput, CreateTodoInput } from "./models"

export type FieldErrors = Partial<Record<string, string>>

export function validateTodoInput(input: CreateTodoInput): FieldErrors {
  return input.title.trim() ? {} : { title: "请输入待办标题" }
}

export function validateScheduleInput(input: CreateScheduleInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.title.trim()) errors.title = "请输入课程标题"
  if (!input.startsAt) errors.startsAt = "请选择开始时间"
  if (!input.endsAt) errors.endsAt = "请选择结束时间"
  if (input.startsAt && input.endsAt && Date.parse(input.endsAt) <= Date.parse(input.startsAt)) errors.endsAt = "结束时间必须晚于开始时间"
  return errors
}

export function validateAssignmentInput(input: CreateAssignmentInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.title.trim()) errors.title = "请输入作业标题"
  if (!input.subject.trim()) errors.subject = "请输入科目"
  if (!input.classId) errors.classId = "请选择班级"
  if (!input.dueAt) errors.dueAt = "请选择截止时间"
  return errors
}
