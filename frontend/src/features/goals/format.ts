import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  parseISO,
} from "date-fns";

import type { Task } from "./types";

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "No date";
  }

  return format(parseISO(value), "MMM d, yyyy");
}

export function formatRelativeDate(value: string | null | undefined) {
  if (!value) {
    return "No date";
  }

  return `${formatDistanceToNowStrict(parseISO(value))} ago`;
}

export function getDueLabel(value: string | null | undefined) {
  if (!value) {
    return "No due date";
  }

  const days = differenceInCalendarDays(parseISO(value), new Date());

  if (days < 0) {
    return `${Math.abs(days)}d overdue`;
  }

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "Due tomorrow";
  }

  return `Due in ${days}d`;
}

export function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") {
      return 1;
    }
    if (a.status !== "done" && b.status === "done") {
      return -1;
    }

    if (a.due_date && b.due_date && a.due_date !== b.due_date) {
      return a.due_date.localeCompare(b.due_date);
    }
    if (a.due_date && !b.due_date) {
      return -1;
    }
    if (!a.due_date && b.due_date) {
      return 1;
    }

    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    return a.created_at.localeCompare(b.created_at);
  });
}
