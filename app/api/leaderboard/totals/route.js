import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// GET /api/leaderboard/totals?type=challenges|workouts&scope=everyone|friends&gender=all|male|female
// Returns leaderboard for total daily challenges done or total workout days
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "challenges"; // challenges or workouts
  const scope = searchParams.get("scope") || "everyone"; // everyone or friends
  const gender = searchParams.get("gender") || "all"; // all, male, or female

  if (!["challenges", "workouts"].includes(type)) {
    return Response.json({ error: "Invalid type. Use 'challenges' or 'workouts'" }, { status: 400 });
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

  if (type === "challenges") {
    // Total daily challenges completed leaderboard
    leaderboard = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        totalDailyChallengesDone: true,
        dailyChallengeStreak: true,
      },
      where: {
        totalDailyChallengesDone: { gt: 0 },
        ...(allowedUserIds ? { id: { in: allowedUserIds } } : {}),
        ...(gender !== "all" ? genderFilter : {}),
      },
      orderBy: [
        { totalDailyChallengesDone: "desc" },
        { dailyChallengeStreak: "desc" },
      ],
      take: 100,
    });
  } else {
    // Total workout days leaderboard
    leaderboard = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        totalWorkoutDaysDone: true,
        currentStreak: true,
      },
      where: {
        totalWorkoutDaysDone: { gt: 0 },
        ...(allowedUserIds ? { id: { in: allowedUserIds } } : {}),
        ...(gender !== "all" ? genderFilter : {}),
      },
      orderBy: [
        { totalWorkoutDaysDone: "desc" },
        { currentStreak: "desc" },
      ],
      take: 100,
    });
  }

  return Response.json({ type, scope, leaderboard });
}
