import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// Calculate coins earned - increasing rewards per level (3x multiplier)
function calculateCoinsEarned(levelReached, difficulty, isInfinityMode = false) {
  if (isInfinityMode) {
    // Infinity mode: Cumulative rewards - sum of all waves from 1 to reached
    // Wave 1: 30, Wave 2: 35, Wave 3: 40, Wave 4: 45, Wave 5: 50, etc.
    // Formula per wave: 30 + (wave - 1) * 5
    // Sum formula: 2.5 * n² + 27.5 * n
    let baseCoins = Math.floor(2.5 * Math.pow(levelReached, 2) + 27.5 * levelReached);

    // Add bonus for higher waves (waves 20+ get extra scaling)
    if (levelReached > 20) {
      baseCoins += Math.floor(Math.pow(levelReached - 20, 1.2) * 50);
    }

    // Difficulty multiplier
    const difficultyMultiplier = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.3, // Hard mode gives 30% bonus
    }[difficulty] || 1.0;

    return Math.floor(baseCoins * difficultyMultiplier);
  }

  // Level mode: Double rewards (2x original)
  // Level 1: 60 coins, Level 2: 72, Level 3: 84, Level 4: 96, etc.
  // Formula: 60 + (level - 1) * 12 + additional scaling for higher levels
  let baseCoins = 60 + (levelReached - 1) * 12;

  // Add additional scaling for higher levels (exponential after level 10)
  if (levelReached > 10) {
    baseCoins += Math.floor(Math.pow(levelReached - 10, 1.5) * 30);
  }

  // Difficulty multiplier
  const difficultyMultiplier = {
    easy: 0.8,
    medium: 1.0,
    hard: 1.2,
  }[difficulty] || 1.0;

  return Math.floor(baseCoins * difficultyMultiplier);
}

export async function POST(request) {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { difficulty, levelReached, result, isInfinityMode } = await request.json();

  if (!["easy", "medium", "hard"].includes(difficulty)) {
    return Response.json({ error: "Invalid difficulty." }, { status: 400 });
  }

  if (!["win", "loss"].includes(result)) {
    return Response.json({ error: "Invalid result." }, { status: 400 });
  }

  const parsedLevelReached = Number(levelReached);
  if (!Number.isFinite(parsedLevelReached) || parsedLevelReached < 1) {
    return Response.json({ error: "Invalid level reached." }, { status: 400 });
  }

  // Calculate coins earned
  // For infinity mode, award coins even on loss (based on waves defeated)
  // For level mode, only award coins on win
  const coinsEarned = (isInfinityMode || result === "win") ? calculateCoinsEarned(parsedLevelReached, difficulty, isInfinityMode) : 0;

  // Check for duplicate game runs within last 10 seconds to prevent multiple submissions
  const tenSecondsAgo = new Date(Date.now() - 10000);
  const recentRun = await prisma.gameRun.findFirst({
    where: {
      userId,
      difficulty,
      levelReached: parsedLevelReached,
      ...(isInfinityMode ? {} : { result }), // Only check result for level mode
      playedAt: { gte: tenSecondsAgo }
    },
    orderBy: { playedAt: 'desc' }
  });

  if (recentRun) {
    // Return the existing game run data instead of creating a duplicate
    return Response.json({
      ok: true,
      coinsEarned: recentRun.coinsEarned,
      newCoins: 0, // No additional coins since this was a duplicate
      levelReached: parsedLevelReached,
      result,
      maxLevelUnlocked: isInfinityMode ? user?.maxGameLevelReached || 1 : null,
      duplicate: true,
    });
  }

  // Get current user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { elo: true, coins: true, maxGameLevelReached: true },
  });

  const currentElo = user?.elo || 0;
  const currentCoins = user?.coins || 0;

  // Record the game run
  await prisma.gameRun.create({
    data: {
      userId,
      difficulty,
      levelReached: parsedLevelReached,
      coinsEarned,
      result,
      isInfinityMode: isInfinityMode || false,
    },
  });

  // Update user's coins and max level
  // For infinity mode, only update coins (not max level)
  // For level mode, update both coins and max level on win
  let updatedUser;
  if (isInfinityMode) {
    // Infinity mode: only update coins
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: coinsEarned } },
      select: { elo: true, coins: true, maxGameLevelReached: true },
    });
  } else if (result === "win") {
    // Level mode win: update coins and max level
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: coinsEarned },
        maxGameLevelReached: Math.max(user?.maxGameLevelReached || 1, parsedLevelReached + 1)
      },
      select: { elo: true, coins: true, maxGameLevelReached: true },
    });
  } else {
    updatedUser = user;
  }

  return Response.json({
    ok: true,
    coinsEarned,
    newCoins: updatedUser.coins,
    levelReached: parsedLevelReached,
    result,
    maxLevelUnlocked: isInfinityMode ? user?.maxGameLevelReached || 1 : updatedUser.maxGameLevelReached,
    duplicate: false,
  });
}

