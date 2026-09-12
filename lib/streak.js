import { daysBetween } from "./dates";

// Lazily computes how a user's streak should be *displayed* right now,
// without needing a background cron job. The actual persisted currentStreak
// only changes when the user logs something (see app/api/logs/route.js).
//
// gap 0 -> logged today already: "active"
// gap 1 -> logged yesterday, not yet today: "grace" (pause icon, "one last chance!")
// gap 2+ -> missed 2+ days: "broken" (displayed as 0, resets for real on next log)
function getStreakDisplay(user) {
  if (!user.lastLoggedDate || user.currentStreak === 0) {
    return { streak: 0, status: "none" };
  }

  const gap = daysBetween(user.lastLoggedDate, new Date());

  if (gap <= 0) return { streak: user.currentStreak, status: "active" };
  if (gap === 1) return { streak: user.currentStreak, status: "grace" };
  return { streak: 0, status: "broken" };
}

export { getStreakDisplay };

