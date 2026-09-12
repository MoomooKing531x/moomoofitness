import { prisma } from "../../../lib/db.js";
import { getUserIdFromCookies } from "../../../lib/auth.js";

// GET /api/compare?targetUserId=xxx&period=today|week|month|year|alltime
// Returns comparison data between current user and target user
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("targetUserId");
  const period = searchParams.get("period") || "alltime";

  const currentUserId = getUserIdFromCookies();

  if (!currentUserId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!targetUserId) {
    return Response.json({ error: "targetUserId is required" }, { status: 400 });
  }

  if (targetUserId === currentUserId) {
    return Response.json({ error: "Cannot compare with yourself" }, { status: 400 });
  }

  // Get date filter based on period
  const now = new Date();
  let startDate = null;

  switch (period) {
    case "today":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    case "alltime":
    default:
      startDate = null;
      break;
  }

  // Get both users
  const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, username: true, displayName: true }
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, displayName: true }
    })
  ]);

  if (!targetUser) {
    return Response.json({ error: "Target user not found" }, { status: 404 });
  }

  // Get all exercises
  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, unit: true }
  });

  // Get logs for both users
  const [currentLogs, targetLogs] = await Promise.all([
    prisma.log.findMany({
      where: {
        userId: currentUserId,
        ...(startDate ? { date: { gte: startDate } } : {})
      },
      select: { exerciseId: true, amount: true, date: true }
    }),
    prisma.log.findMany({
      where: {
        userId: targetUserId,
        ...(startDate ? { date: { gte: startDate } } : {})
      },
      select: { exerciseId: true, amount: true, date: true }
    })
  ]);

  // Group logs by exercise and date
  const groupLogsByExercise = (logs) => {
    const grouped = {};
    logs.forEach(log => {
      if (!grouped[log.exerciseId]) {
        grouped[log.exerciseId] = { total: 0, byDate: {} };
      }
      grouped[log.exerciseId].total += log.amount;
      const dateKey = log.date.toISOString().split('T')[0];
      grouped[log.exerciseId].byDate[dateKey] = (grouped[log.exerciseId].byDate[dateKey] || 0) + log.amount;
    });
    return grouped;
  };

  const currentGrouped = groupLogsByExercise(currentLogs);
  const targetGrouped = groupLogsByExercise(targetLogs);

  // Build comparison data for each exercise
  const comparisons = exercises.map(exercise => {
    const currentData = currentGrouped[exercise.id] || { total: 0, byDate: {} };
    const targetData = targetGrouped[exercise.id] || { total: 0, byDate: {} };

    // Get all unique dates from both users
    const allDates = new Set([
      ...Object.keys(currentData.byDate),
      ...Object.keys(targetData.byDate)
    ]);
    const sortedDates = Array.from(allDates).sort();

    // Build time series data
    const timeSeries = sortedDates.map(date => ({
      date,
      currentUser: currentData.byDate[date] || 0,
      targetUser: targetData.byDate[date] || 0
    }));

    // Calculate analysis
    const currentTotal = currentData.total;
    const targetTotal = targetData.total;
    const diff = currentTotal - targetTotal;
    const percentDiff = targetTotal > 0 ? ((diff / targetTotal) * 100).toFixed(1) : (currentTotal > 0 ? 100 : 0);

    // Calculate weekly trend (last 7 days vs previous 7 days)
    const now2 = new Date();
    const weekAgo = new Date(now2.setDate(now2.getDate() - 7));
    const twoWeeksAgo = new Date(now2.setDate(now2.getDate() - 7));

    const currentLastWeek = currentLogs.filter(l => l.exerciseId === exercise.id && new Date(l.date) >= weekAgo).reduce((sum, l) => sum + l.amount, 0);
    const currentPrevWeek = currentLogs.filter(l => l.exerciseId === exercise.id && new Date(l.date) >= twoWeeksAgo && new Date(l.date) < weekAgo).reduce((sum, l) => sum + l.amount, 0);
    const targetLastWeek = targetLogs.filter(l => l.exerciseId === exercise.id && new Date(l.date) >= weekAgo).reduce((sum, l) => sum + l.amount, 0);
    const targetPrevWeek = targetLogs.filter(l => l.exerciseId === exercise.id && new Date(l.date) >= twoWeeksAgo && new Date(l.date) < weekAgo).reduce((sum, l) => sum + l.amount, 0);

    const currentWeekChange = currentPrevWeek > 0 ? ((currentLastWeek - currentPrevWeek) / currentPrevWeek * 100).toFixed(1) : (currentLastWeek > 0 ? 100 : 0);
    const targetWeekChange = targetPrevWeek > 0 ? ((targetLastWeek - targetPrevWeek) / targetPrevWeek * 100).toFixed(1) : (targetLastWeek > 0 ? 100 : 0);

    return {
      exercise: {
        id: exercise.id,
        name: exercise.name,
        unit: exercise.unit
      },
      currentUser: {
        total: currentTotal,
        timeSeries
      },
      targetUser: {
        total: targetTotal,
        timeSeries
      },
      analysis: {
        difference: diff,
        percentDifference: parseFloat(percentDiff),
        currentWeekChange: parseFloat(currentWeekChange),
        targetWeekChange: parseFloat(targetWeekChange),
        winner: currentTotal > targetTotal ? 'current' : (targetTotal > currentTotal ? 'target' : 'tie')
      }
    };
  });

  // Filter out exercises with no data for either user
  const meaningfulComparisons = comparisons.filter(c => c.currentUser.total > 0 || c.targetUser.total > 0);

  // Overall analysis
  const currentOverallTotal = Object.values(currentGrouped).reduce((sum, data) => sum + data.total, 0);
  const targetOverallTotal = Object.values(targetGrouped).reduce((sum, data) => sum + data.total, 0);
  const exercisesWon = meaningfulComparisons.filter(c => c.analysis.winner === 'current').length;
  const exercisesLost = meaningfulComparisons.filter(c => c.analysis.winner === 'target').length;

  return Response.json({
    currentUser,
    targetUser,
    period,
    comparisons: meaningfulComparisons,
    overallAnalysis: {
      currentTotal: currentOverallTotal,
      targetTotal: targetOverallTotal,
      exercisesWon,
      exercisesLost,
      exercisesTied: meaningfulComparisons.length - exercisesWon - exercisesLost
    }
  });
}
