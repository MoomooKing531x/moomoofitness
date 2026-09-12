import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function GET(request) {
  try {
    const userId = getUserIdFromCookies();

    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's current coins
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true }
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Get all bets where user is creator or accepter, excluding dismissed bets
    const bets = await prisma.bet.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { accepterId: userId },
        ],
        status: { in: ["pending", "accepted", "denied", "expired", "creator_won", "accepter_won"] },
        dismissedAt: null, // Only show non-dismissed bets
      },
      include: {
        creator: { select: { id: true, username: true, displayName: true } },
        accepter: { select: { id: true, username: true, displayName: true } },
        exercise: { select: { id: true, name: true, unit: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add progress and opponent info for each bet
    const enrichedBets = bets.map((bet) => {
      const isCreator = bet.creatorId === userId;
      const myProgress = isCreator ? bet.creatorProgress : bet.accepterProgress;
      const opponentProgress = isCreator ? bet.accepterProgress : bet.creatorProgress;
      const opponent = isCreator ? bet.accepter : bet.creator;
      const timeRemaining = Math.max(0, Math.ceil((bet.deadline - new Date()) / (1000 * 60 * 60 * 24)));

      return {
        ...bet,
        isCreator,
        myProgress,
        opponentProgress,
        opponent,
        timeRemaining,
        progressPercent: Math.round((myProgress / bet.targetReps) * 100),
      };
    });

    return Response.json({ bets: enrichedBets, userCoins: user.coins });
  } catch (error) {
    console.error("Error fetching bets:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
