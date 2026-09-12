import { prisma } from "./db";
import { startOfUTCDay, daysBetween } from "./dates";

// Resolves an exerciseId OR a customName into a concrete Exercise row.
// Custom exercises are created on first use as private (isPublic: false).
// Once 2+ distinct users have logged the *same* normalized name, it's
// promoted to isPublic: true and starts appearing on the shared grid/leaderboards.
async function resolveExercise({ exerciseId, customName, userId }) {
  if (exerciseId) {
    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) throw new Error("Exercise not found.");
    return exercise;
  }

  const trimmed = (customName || "").trim();
  if (!trimmed) throw new Error("exerciseId or customName required.");
  if (trimmed.length > 40) throw new Error("Exercise name too long.");

  const normalizedName = trimmed.toLowerCase();

  let exercise = await prisma.exercise.findUnique({ where: { normalizedName } });
  if (!exercise) {
    exercise = await prisma.exercise.create({
      data: {
        name: trimmed,
        normalizedName,
        category: "custom",
        unit: "reps",
        isOfficial: false,
        isPublic: false,
        createdByUserId: userId,
      },
    });
  }
  return exercise;
}

// Checks whether a not-yet-public custom exercise has reached 2+ distinct
// loggers, and promotes it to public (visible to everyone) if so.
async function maybePromoteExercise(exercise) {
  if (exercise.isPublic) return;

  const distinctLoggers = await prisma.log.findMany({
    where: { exerciseId: exercise.id },
    distinct: ["userId"],
    select: { userId: true },
  });

  if (distinctLoggers.length >= 2) {
    await prisma.exercise.update({
      where: { id: exercise.id },
      data: { isPublic: true },
    });
  }
}

// Writes a Log row and updates the user's streak by checking actual log dates
async function recordLog({ userId, exercise, amount, reps, sets }) {
  const today = startOfUTCDay(new Date());

  await prisma.log.create({
    data: { 
      userId, 
      exerciseId: exercise.id, 
      amount, 
      reps: reps || null,
      sets: sets || null,
      date: today 
    },
  });

  await maybePromoteExercise(exercise);

  // Get all logs for past 7 days, grouped by unique dates
  const recentLogs = await prisma.log.findMany({
    where: {
      userId,
      date: {
        gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        lte: today,
      },
    },
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "desc" },
  });

  // Get unique dates in descending order (newest first)
  const uniqueDates = recentLogs
    .map((log) => startOfUTCDay(new Date(log.date)).getTime())
    .sort((a, b) => b - a);

  let currentStreak = 0;

  if (uniqueDates.length > 0) {
    // Count consecutive days from today backwards
    let checkDate = today.getTime();
    
    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === checkDate) {
        currentStreak += 1;
        checkDate -= 24 * 60 * 60 * 1000; // go back one day
      } else {
        break;
      }
    }
  } else {
    currentStreak = 1;
  }

  // Get current longest streak from DB and update if needed
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const longestStreak = Math.max(user.longestStreak, currentStreak);

  await prisma.user.update({
    where: { id: userId },
    data: { currentStreak, longestStreak, lastLoggedDate: today },
  });

  return { currentStreak, longestStreak };
}

export { resolveExercise, maybePromoteExercise, recordLog };
