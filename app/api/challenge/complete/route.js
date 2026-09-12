import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";
import { recordLog } from "../../../../lib/logging.js";
import { calculatePoints, calculateElo } from "../../../../lib/points.js";

// POST /api/challenge/complete { challengeId }
// Honor-system: marks the challenge done and logs the target amount
// against that exercise, so it counts on leaderboards too.
// Awards ELO + GP (game points) just like manual exercise logging.
export async function POST(request) {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Not logged in." }, { status: 401 });

  const { challengeId } = await request.json();
  if (!challengeId) return Response.json({ error: "challengeId required." }, { status: 400 });

  const challenge = await prisma.dailyChallenge.findUnique({
    where: { id: challengeId },
    include: { exercise: true },
  });
  if (!challenge) return Response.json({ error: "Challenge not found." }, { status: 404 });

  const already = await prisma.challengeCompletion.findUnique({
    where: { userId_challengeId: { userId, challengeId } },
  });
  if (already) return Response.json({ error: "Already completed today." }, { status: 409 });

  await prisma.challengeCompletion.create({ data: { userId, challengeId } });

  const { currentStreak, longestStreak } = await recordLog({
    userId,
    exercise: challenge.exercise,
    amount: challenge.targetAmount,
  });

  // Calculate ELO based on exercise
  const eloEarned = calculateElo(challenge.exercise, challenge.targetAmount);

  // Update user ELO (exercise points = GP game points) and challenge tracking
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { 
      elo: { increment: eloEarned },
      totalDailyChallengesDone: { increment: 1 },
      dailyChallengeStreak: { increment: 1 },
    },
    select: { elo: true, coins: true, dailyChallengeStreak: true },
  });

  return Response.json({ 
    ok: true, 
    currentStreak, 
    longestStreak, 
    eloEarned,
    userElo: updatedUser.elo,
    userCoins: updatedUser.coins,
    dailyChallengeStreak: updatedUser.dailyChallengeStreak,
  });
}

