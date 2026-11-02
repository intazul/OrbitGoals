/**
 * Data Export Utility (CSV, Markdown, JSON)
 * Implements Feature 8: Full Data Export for habits, goals, notes, and progress records.
 */
import { Habit, Goal, UserProfile } from '../types';

/**
 * Escapes a cell for CSV format
 */
function escapeCSV(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Download a generic text/blob file
 */
function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports Habits to CSV format
 */
export function exportHabitsToCSV(habits: Habit[]): string {
  const headers = [
    'ID',
    'Title',
    'Category',
    'Time of Day',
    'Frequency',
    'Current Streak (Days)',
    'Best Streak (Days)',
    'Tracking Type',
    'Target Value',
    'Unit',
    'Step Value',
    'XP Per Set',
    'Today Progress',
    'Total Check-Ins',
    'Connected Goal',
    'Created Date',
    'Completed Dates List',
  ];

  const rows = habits.map((h) => [
    escapeCSV(h.id),
    escapeCSV(h.title),
    escapeCSV(h.category),
    escapeCSV(h.timeOfDay),
    escapeCSV(h.frequency),
    escapeCSV(h.streakDays || 0),
    escapeCSV(h.bestStreak || 0),
    escapeCSV(h.trackingType || 'simple'),
    escapeCSV(h.targetValue || 1),
    escapeCSV(h.unit || 'reps'),
    escapeCSV(h.stepValue || 1),
    escapeCSV(h.xpPerSet || 10),
    escapeCSV(h.todayProgress || 0),
    escapeCSV(h.completedDates?.length || 0),
    escapeCSV(h.linkedGoalTitle || ''),
    escapeCSV(h.createdAt || ''),
    escapeCSV((h.completedDates || []).join('; ')),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Download Habits CSV
 */
export function downloadHabitsCSV(habits: Habit[]): void {
  const csv = exportHabitsToCSV(habits);
  const date = new Date().toISOString().split('T')[0];
  downloadBlob(csv, `orbitgoals_habits_${date}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Exports Goals to CSV format
 */
export function exportGoalsToCSV(goals: Goal[]): string {
  const headers = [
    'ID',
    'Title',
    'Category',
    'Current Value',
    'Target Value',
    'Unit',
    'Completion %',
    'Frequency',
    'Priority',
    'Difficulty',
    'XP Reward',
    'Deadline',
    'Created Date',
    'Subtasks Count',
    'History Entries Count',
    'Notes',
  ];

  const rows = goals.map((g) => {
    const target = g.targetValue || 1;
    const current = g.currentValue || 0;
    const pct = Math.min(100, Math.round((current / target) * 100));

    return [
      escapeCSV(g.id),
      escapeCSV(g.title),
      escapeCSV(g.category),
      escapeCSV(current),
      escapeCSV(target),
      escapeCSV(g.unit || 'units'),
      escapeCSV(`${pct}%`),
      escapeCSV(g.frequency),
      escapeCSV(g.priority),
      escapeCSV(g.difficulty),
      escapeCSV(g.xpReward || 50),
      escapeCSV(g.deadline || 'None'),
      escapeCSV(g.createdAt || ''),
      escapeCSV(g.subtasks?.length || 0),
      escapeCSV(g.history?.length || 0),
      escapeCSV(g.notes || ''),
    ];
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Download Goals CSV
 */
export function downloadGoalsCSV(goals: Goal[]): void {
  const csv = exportGoalsToCSV(goals);
  const date = new Date().toISOString().split('T')[0];
  downloadBlob(csv, `orbitgoals_goals_${date}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Exports Full Markdown Summary (compatible with Notion, Obsidian, GitHub)
 */
export function exportMarkdownSummary(habits: Habit[], goals: Goal[], profile: UserProfile): string {
  const date = new Date().toISOString().split('T')[0];
  const lines: string[] = [
    `# OrbitGoals Productivity Report`,
    `Generated on: **${date}** | User: **${profile.name || 'Achiever'}** (Level ${profile.level || 1})`,
    '',
    `## 🎯 Goals Summary (${goals.length} Total)`,
    '',
  ];

  if (goals.length === 0) {
    lines.push('_No goals recorded yet._\n');
  } else {
    goals.forEach((g, i) => {
      const pct = Math.min(100, Math.round(((g.currentValue || 0) / (g.targetValue || 1)) * 100));
      lines.push(`### ${i + 1}. ${g.title}`);
      lines.push(`- **Category**: ${g.category} | **Priority**: ${g.priority} | **Difficulty**: ${g.difficulty}`);
      lines.push(`- **Progress**: ${g.currentValue || 0} / ${g.targetValue} ${g.unit || 'units'} (**${pct}%**)`);
      if (g.deadline) lines.push(`- **Target Date**: ${g.deadline}`);
      if (g.notes) lines.push(`- **Notes**: ${g.notes}`);
      lines.push('');
    });
  }

  lines.push(`## ⚡ Daily Habits Summary (${habits.length} Total)`);
  lines.push('');

  if (habits.length === 0) {
    lines.push('_No habits recorded yet._\n');
  } else {
    habits.forEach((h, i) => {
      lines.push(`### ${i + 1}. ${h.title}`);
      lines.push(`- **Category**: ${h.category} | **Schedule**: ${h.timeOfDay} (${h.frequency})`);
      lines.push(`- **Streak**: 🔥 ${h.streakDays} days (Best: 🏆 ${h.bestStreak || h.streakDays} days)`);
      lines.push(`- **Total Check-Ins**: ✅ ${h.completedDates?.length || 0} times logged`);
      if (h.trackingType === 'sets') {
        lines.push(`- **Target**: ${h.targetValue} ${h.unit || 'reps'} in sets of ${h.stepValue || 10}`);
      }
      lines.push('');
    });
  }

  return lines.join('\n');
}

/**
 * Download Markdown Summary
 */
export function downloadMarkdownSummary(habits: Habit[], goals: Goal[], profile: UserProfile): void {
  const md = exportMarkdownSummary(habits, goals, profile);
  const date = new Date().toISOString().split('T')[0];
  downloadBlob(md, `orbitgoals_summary_${date}.md`, 'text/markdown;charset=utf-8');
}
