import { addWeeks, format, startOfWeek } from "date-fns";

const WEEK_STARTS_ON = 1;

export function calculateWeeklyStreak(
  completedAtValues: Array<string | null | undefined>,
  referenceDate = new Date(),
) {
  const completedWeeks = new Set(
    completedAtValues
      .map(parseDate)
      .filter((date): date is Date => date !== null)
      .map((date) => weekKey(date)),
  );
  let cursor = startOfWeek(referenceDate, { weekStartsOn: WEEK_STARTS_ON });
  let streak = 0;

  while (completedWeeks.has(weekKey(cursor))) {
    streak += 1;
    cursor = addWeeks(cursor, -1);
  }

  return streak;
}

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function weekKey(date: Date) {
  return format(startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON }), "yyyy-MM-dd");
}
