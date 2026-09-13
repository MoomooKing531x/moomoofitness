import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// Calculate coins earned - increasing rewards per level (3x multiplier)
function calculateCoinsEarned(levelReached, difficulty) {
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

  const { difficulty, levelReached, result } = await request.json();

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

  // Calculate base coins earned
  const baseCoinsEarned = result === "win" ? calculateCoinsEarned(parsedLevelReached, difficulty) : 0;

  // Apply diminishing rewards for level mode wins
  let coinsEarned = baseCoinsEarned;
  let completionCount = 0;

  if (result === "win") {
    // Check if level completion exists and if it needs reset (3 days)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    let levelCompletion = await prisma.levelCompletion.findUnique({
      where: { userId_level: { userId, level: parsedLevelReached } }
    });

    if (levelCompletion) {
      // Check if reset is needed (3 days since last reset)
      if (levelCompletion.lastResetAt < threeDaysAgo) {
        // Reset completion count
        levelCompletion = await prisma.levelCompletion.update({
          where: { userId_level: { userId, level: parsedLevelReached } },
          data: { completionCount: 0, lastResetAt: new Date() }
        });
      }
      completionCount = levelCompletion.completionCount;
    }

    // Calculate diminished reward: 100% -> 50% -> 25% -> 12.5% -> ... until 1 coin minimum
    if (completionCount > 0) {
      const diminishingFactor = Math.pow(0.5, completionCount);
      coinsEarned = Math.max(1, Math.floor(baseCoinsEarned * diminishingFactor));
    }
  }

  // Get current user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { elo: true, coins: true, maxGameLevelReached: true },
  });

  const currentElo = user?.elo || 0;
  const currentCoins = user?.coins || 0;
  const currentMaxLevel = user?.maxGameLevelReached || 1;

  // Check for duplicate game runs within last 10 seconds to prevent multiple submissions
  const tenSecondsAgo = new Date(Date.now() - 10000);
  const recentRun = await prisma.gameRun.findFirst({
    where: {
      userId,
      difficulty,
      levelReached: parsedLevelReached,
      result,
      playedAt: { gte: tenSecondsAgo }
    },
    orderBy: { playedAt: 'desc' }
  });

  if (recentRun) {
    // Return the existing game run data instead of creating a duplicate
    // But fetch current user data to get the actual max level
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { maxGameLevelReached: true }
    });
    
    return Response.json({
      ok: true,
      coinsEarned: recentRun.coinsEarned,
      newCoins: 0, // No additional coins since this was a duplicate
      levelReached: parsedLevelReached,
      result,
      maxLevelUnlocked: currentUser?.maxGameLevelReached || 1,
      duplicate: true,
    });
  }

  // Record the game run
  await prisma.gameRun.create({
    data: {
      userId,
      difficulty,
      levelReached: parsedLevelReached,
      coinsEarned,
      result,
      isInfinityMode: false,
    },
  });

  // Update level completion tracking for level mode wins
  if (result === "win") {
    await prisma.levelCompletion.upsert({
      where: { userId_level: { userId, level: parsedLevelReached } },
      update: {
        completionCount: { increment: 1 },
        lastCompletedAt: new Date()
      },
      create: {
        userId,
        level: parsedLevelReached,
        completionCount: 1,
        lastCompletedAt: new Date(),
        lastResetAt: new Date()
      }
    });
  }

  // Update user's coins and max level
  // Only update coins and max level on win
  let updatedUser;
  if (result === "win") {
    // Level mode win: update coins and max level
    // Max level should be the greater of: current max or (completed level + 1)
    const newMaxLevel = Math.max(currentMaxLevel, parsedLevelReached + 1);
    
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: coinsEarned },
        maxGameLevelReached: newMaxLevel
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
    maxLevelUnlocked: updatedUser.maxGameLevelReached,
    duplicate: false,
  });
}

