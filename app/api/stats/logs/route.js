import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function GET(request) {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId");

  if (!targetUserId) {
    return Response.json({ error: "User ID required" }, { status: 400 });
  }

  // Verify the requesting user can view the target user's stats
  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, statsVisibility: true },
  });

  if (!viewer || !targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const isYou = targetUser.id === viewer.id;
  let canViewStats = isYou;

  if (!isYou) {
    if (targetUser.statsVisibility === "public") {
      canViewStats = true;
    } else if (targetUser.statsVisibility === "friends") {
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: "accepted",
          OR: [
            { requesterId: viewer.id, addresseeId: targetUser.id },
            { requesterId: targetUser.id, addresseeId: viewer.id },
          ],
        },
      });
      canViewStats = !!friendship;
    }
  }

  if (!canViewStats) {
    return Response.json({ stats: [] });
  }

  const totalsByExercise = await prisma.log.groupBy({
    by: ["exerciseId"],
    where: { userId: targetUserId },
    _sum: { amount: true },
  });

  const exercises = await prisma.exercise.findMany({
    where: { id: { in: totalsByExercise.map((t) => t.exerciseId) } },
  });

  const exerciseById = Object.fromEntries(exercises.map((e) => [e.id, e]));

  const stats = totalsByExercise
    .map((t) => ({
      exercise: exerciseById[t.exerciseId],
      total: t._sum.amount || 0,
    }))
    .filter((s) => s.exercise)
    .sort((a, b) => a.exercise.name.localeCompare(b.exercise.name));

  return Response.json({ stats });
}
