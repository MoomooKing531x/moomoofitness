import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// GET /api/game/leaderboard?scope=everyone|friends&search=username
export async function GET(request) {
  const currentUserId = getUserIdFromCookies();
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "everyone";
  const search = (searchParams.get("search") || "").trim().toLowerCase();

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

  // Get all users with their game run coin totals
  const allUsers = await prisma.user.findMany({
    where: allowedUserIds ? { id: { in: allowedUserIds } } : {},
    select: {
      id: true,
      username: true,
    },
  });

  // Calculate total coins earned from game runs for each user
  const usersWithCoins = await Promise.all(
    allUsers.map(async (user) => {
      const gameRuns = await prisma.gameRun.groupBy({
        by: ['userId'],
        where: { userId: user.id, result: 'win' },
        _sum: { coinsEarned: true }
      });
      
      const totalCoins = gameRuns[0]?._sum.coinsEarned || 0;
      
      return {
        userId: user.id,
        username: user.username,
        totalCoins,
      };
    })
  );

  // Filter users who have earned coins from games
  const usersWithGameCoins = usersWithCoins
    .filter((u) => u.totalCoins > 0)
    .sort((a, b) => b.totalCoins - a.totalCoins)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const top10 = usersWithGameCoins.slice(0, 10);
  const you = currentUserId ? usersWithGameCoins.find((r) => r.userId === currentUserId) : null;
  const searched = search
    ? usersWithGameCoins.find((r) => r.username.toLowerCase() === search) || null
    : null;

  return Response.json({
    scope,
    top10,
    you: you || null,
    searched,
  });
}

