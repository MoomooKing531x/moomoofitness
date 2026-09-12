const { prisma } = require("../../../../lib/db");
const { getUserIdFromCookies } = require("../../../../lib/auth");
const { windowStart } = require("../../../../lib/dates");

// GET /api/leaderboard/:exerciseId?window=today|weekly|monthly|yearly|alltime&scope=everyone|friends&search=username
export async function GET(request, { params }) {
  const { exerciseId } = params;
  const currentUserId = getUserIdFromCookies();
  const { searchParams } = new URL(request.url);
  const window = searchParams.get("window") || "alltime";
  const period = searchParams.get("period") || window; // support both "window" and "period"
  const scope = searchParams.get("scope") || "everyone";
  const search = (searchParams.get("search") || "").trim().toLowerCase();

  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!exercise) return Response.json({ error: "Exercise not found." }, { status: 404 });

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

  const dateFilter = windowStart(period);

  const logs = await prisma.log.findMany({
    where: {
      exerciseId,
      ...(dateFilter ? { date: { gte: dateFilter } } : {}),
      ...(allowedUserIds ? { userId: { in: allowedUserIds } } : {}),
    },
    select: {
      userId: true,
      amount: true,
      reps: true,
      sets: true,
    },
  });

  // Calculate best single set (max reps per set if reps/sets exist, otherwise amount)
  const userRecords = {};
  logs.forEach((log) => {
    if (!userRecords[log.userId]) {
      userRecords[log.userId] = {
        total: 0,
        singleSetRecord: 0,
        count: 0,
      };
    }
    userRecords[log.userId].total += log.amount;
    userRecords[log.userId].count += 1;

    // Best single set record: use reps if available, otherwise use amount
    const singleSetAmount = log.reps || log.amount;
    userRecords[log.userId].singleSetRecord = Math.max(
      userRecords[log.userId].singleSetRecord,
      singleSetAmount
    );
  });

  const users = await prisma.user.findMany({
    where: { id: { in: Object.keys(userRecords) } },
    select: { id: true, username: true },
  });
  const usernameById = Object.fromEntries(users.map((u) => [u.id, u.username]));

  // Sort by single set record (primary) then total (secondary)
  const ranked = Object.entries(userRecords)
    .map(([userId, record]) => ({
      userId,
      username: usernameById[userId] || "unknown",
      total: record.total,
      singleSetRecord: record.singleSetRecord,
      count: record.count,
    }))
    .sort((a, b) => {
      if (b.singleSetRecord !== a.singleSetRecord) {
        return b.singleSetRecord - a.singleSetRecord;
      }
      return b.total - a.total;
    })
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const entries = ranked; // Return all entries, not just top 10
  const top10 = ranked.slice(0, 10);
  const you = currentUserId ? ranked.find((r) => r.userId === currentUserId) : null;
  const searched = search
    ? ranked.find((r) => r.username.toLowerCase() === search) || null
    : null;

  return Response.json({
    exercise: { id: exercise.id, name: exercise.name, unit: exercise.unit },
    period,
    scope,
    entries,
    top10,
    you: you || null,
    searched,
  });
}
