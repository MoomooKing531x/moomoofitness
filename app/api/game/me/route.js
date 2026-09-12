import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function GET() {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      elo: true,
      gp: true,
      coins: true,
      maxGameLevelReached: true,
    },
  });

  return Response.json({
    elo: user?.elo || 0,                  // Exercise points
    gp: user?.gp || 0,                    // Game points (for game purchases)
    coins: user?.coins || 0,              // Coins earned from wins
    maxLevelUnlocked: user?.maxGameLevelReached || 1,  // Highest level completed
  });
}

