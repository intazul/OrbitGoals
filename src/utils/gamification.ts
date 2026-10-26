export const XP_PER_HABIT = 10;
export const XP_PER_GOAL_STEP = 50;
export const XP_PER_LEVEL = 200;

export const RANK_TITLES: { minLevel: number; title: string; badge: string }[] = [
  { minLevel: 10, title: 'Grandmaster Titan', badge: '👑' },
  { minLevel: 9, title: 'Vanguard Achiever', badge: '🔱' },
  { minLevel: 8, title: 'Elite Strategist', badge: '🎖️' },
  { minLevel: 7, title: 'Discipline Champion', badge: '🛡️' },
  { minLevel: 6, title: 'Focus Master', badge: '⚔️' },
  { minLevel: 5, title: 'Goal Striker', badge: '🎯' },
  { minLevel: 4, title: 'Consistency Prodigy', badge: '⚡' },
  { minLevel: 3, title: 'Habit Apprentice', badge: '🔥' },
  { minLevel: 2, title: 'Momentum Builder', badge: '🚀' },
  { minLevel: 1, title: 'Novice Achiever', badge: '🌱' },
];

export function getRankInfo(level: number): { title: string; badge: string } {
  const match = RANK_TITLES.find((r) => level >= r.minLevel);
  return match || { title: 'Novice Achiever', badge: '🌱' };
}

export function calculateLevel(xp: number): number {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

export function calculateLevelProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  percent: number;
} {
  const level = calculateLevel(xp);
  const currentLevelXp = xp % XP_PER_LEVEL;
  const nextLevelXp = XP_PER_LEVEL;
  const percent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    percent,
  };
}

/**
 * Calculates current streak (consecutive days) counting backwards from today or yesterday.
 */
export function calculateStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) return 0;

  const dateSet = new Set(completedDates);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If neither today nor yesterday is completed, the streak has lapsed
  if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) {
    return 0;
  }

  // Count backwards from starting day (today if completed, otherwise yesterday)
  let checkDate = dateSet.has(todayStr) ? new Date(today) : new Date(yesterday);
  let streak = 0;

  while (true) {
    const checkStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(checkStr)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Returns the current week's 7 days (Monday to Sunday)
 */
export function getCurrentWeekDays(): {
  dateStr: string;
  dayLetter: string;
  dayNum: number;
  isToday: boolean;
}[] {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
  // Calculate distance to previous Monday
  const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);

  const days = [];
  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayStr = now.toISOString().split('T')[0];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    days.push({
      dateStr,
      dayLetter: dayLetters[i],
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }

  return days;
}
