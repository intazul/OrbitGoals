/**
 * Calendar Export Utility (.ics / Google Calendar / Apple Calendar)
 * Implements Feature 7: Exporting habits and goal schedules to real calendar apps.
 */
import { Habit, Goal } from '../types';

/**
 * Helper to format date into iCalendar UTC/Date timestamp format (YYYYMMDDTHHmmssZ or YYYYMMDD)
 */
function formatICSDate(date: Date, allDay: boolean = false): string {
  if (allDay) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Escapes characters for iCalendar string values
 */
function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an iCalendar (.ics) string containing all habit reminders and goal deadlines
 */
export function generateCalendarICS(habits: Habit[], goals: Goal[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OrbitGoals//Productivity App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:OrbitGoals Schedule',
    'X-WR-TIMEZONE:UTC',
  ];

  const now = new Date();
  const dtStamp = formatICSDate(now);

  // 1. Add Goals as milestone events (using their deadlines)
  goals.forEach((goal) => {
    if (!goal.deadline) return;

    try {
      const [year, month, day] = goal.deadline.split('-').map(Number);
      const deadlineDate = new Date(year, month - 1, day, 9, 0, 0); // 9:00 AM on deadline day
      const endDate = new Date(year, month - 1, day, 10, 0, 0);

      const uid = `goal-${goal.id}-${year}${month}${day}@orbitgoals.app`;
      const summary = escapeICS(`🎯 Goal Deadline: ${goal.title}`);
      const description = escapeICS(
        `Target: ${goal.targetValue} ${goal.unit}\\nCategory: ${goal.category}\\nPriority: ${goal.priority}\\nDifficulty: ${goal.difficulty}\\nNotes: ${goal.notes || 'Tracked via OrbitGoals'}`
      );

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtStamp}`);
      lines.push(`DTSTART:${formatICSDate(deadlineDate)}`);
      lines.push(`DTEND:${formatICSDate(endDate)}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${description}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('BEGIN:VALARM');
      lines.push('TRIGGER:-PT24H'); // 24 hours prior reminder
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${summary}`);
      lines.push('END:VALARM');
      lines.push('END:VEVENT');
    } catch {
      // ignore invalid dates
    }
  });

  // 2. Add Habits as recurring daily events
  habits.forEach((habit) => {
    try {
      const uid = `habit-${habit.id}@orbitgoals.app`;
      const summary = escapeICS(`⚡ Habit: ${habit.title}`);
      const description = escapeICS(
        `Daily habit: ${habit.title}\\nCategory: ${habit.category}\\nTime of Day: ${habit.timeOfDay}\\nTarget: ${habit.targetValue || 1} ${habit.unit || 'times'}\\nStreak: ${habit.streakDays} days`
      );

      // Determine default start time based on timeOfDay or reminderTime
      let startHour = 9;
      if (habit.timeOfDay === 'morning') startHour = 8;
      if (habit.timeOfDay === 'afternoon') startHour = 14;
      if (habit.timeOfDay === 'evening') startHour = 20;

      if (habit.reminderTime) {
        const [h] = habit.reminderTime.split(':').map(Number);
        if (!isNaN(h)) startHour = h;
      }

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 30, 0);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtStamp}`);
      lines.push(`DTSTART:${formatICSDate(todayStart)}`);
      lines.push(`DTEND:${formatICSDate(todayEnd)}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${description}`);

      // Recurrence rule
      if (habit.frequency === 'weekdays') {
        lines.push('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
      } else if (habit.frequency === 'weekends') {
        lines.push('RRULE:FREQ=WEEKLY;BYDAY=SA,SU');
      } else {
        lines.push('RRULE:FREQ=DAILY');
      }

      lines.push('STATUS:CONFIRMED');
      lines.push('BEGIN:VALARM');
      lines.push('TRIGGER:-PT15M'); // 15 mins prior reminder
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${summary}`);
      lines.push('END:VALARM');
      lines.push('END:VEVENT');
    } catch {
      // ignore
    }
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Downloads the .ics file to user's device
 */
export function downloadCalendarICS(habits: Habit[], goals: Goal[]): void {
  const icsData = generateCalendarICS(habits, goals);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orbitgoals_schedule_${new Date().toISOString().split('T')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a direct "Add to Google Calendar" web link for a goal deadline
 */
export function getGoogleCalendarUrlForGoal(goal: Goal): string {
  if (!goal.deadline) return '';
  try {
    const [year, month, day] = goal.deadline.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 9, 0, 0);
    const endDate = new Date(year, month - 1, day, 10, 0, 0);

    const startStr = formatICSDate(startDate);
    const endStr = formatICSDate(endDate);

    const title = encodeURIComponent(`🎯 Goal: ${goal.title}`);
    const details = encodeURIComponent(
      `Target: ${goal.targetValue} ${goal.unit}\nCategory: ${goal.category}\nPriority: ${goal.priority}\nNotes: ${goal.notes || 'Tracked in OrbitGoals'}`
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
  } catch {
    return '';
  }
}
