import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// GET /api/leaderboard/streaks?type=daily|workout&scope=everyone|friends&gender=all|male|female
// Returns leaderboard for daily challenge streak or workout streak
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "daily"; // daily or workout
  const scope = searchParams.get("scope") || "everyone"; // everyone or friends
  const gender = searchParams.get("gender") || "all"; // all, male, or female

  if (!["daily", "workout"].includes(type)) {
    return Response.json({ error: "Invalid type. Use 'daily' or 'workout'" }, { status: 400 });
  }

  const currentUserId = getUserIdFromCookies();

  // Build the "which users count" filter for friends-only scope.
  let allowedUserIds = null; // null = everyone
  if (scope === "friends") {
    if (!currentUserId) {
      return Response.json({ error: "Log in to view friends leaderboard." }, { status: 401 });
    }
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
      },
    });
    const friendIds = friendships.map((f) =>
      f.requesterId === currentUserId ? f.addresseeId : f.requesterId
    );
    allowedUserIds = [...friendIds, currentUserId];
  }

  // Build gender filter
  let genderFilter = {};
  if (gender !== "all") {
    genderFilter = { gender: gender === "male" ? "male" : "female" };
  }

  let leaderboard;

  if (type === "daily") {
    // Daily challenge streak leaderboard
    leaderboard = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        dailyChallengeStreak: true,
        totalDailyChallengesDone: true,
      },
      where: {
        dailyChallengeStreak: { gt: 0 },
        ...(allowedUserIds ? { id: { in: allowedUserIds } } : {}),
        ...(gender !== "all" ? genderFilter : {}),
      },
      orderBy: [
        { dailyChallengeStreak: "desc" },
        { totalDailyChallengesDone: "desc" },
      ],
      take: 100,
    });
  } else {
    // Workout days leaderboard (currentStreak)
    leaderboard = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        currentStreak: true,
        totalWorkoutDaysDone: true,
      },
      where: {
        currentStreak: { gt: 0 },
        ...(allowedUserIds ? { id: { in: allowedUserIds } } : {}),
        ...(gender !== "all" ? genderFilter : {}),
      },
      orderBy: [
        { currentStreak: "desc" },
        { totalWorkoutDaysDone: "desc" },
      ],
      take: 100,
    });
  }

  return Response.json({ type, scope, leaderboard });
}
