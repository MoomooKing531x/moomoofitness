import { prisma } from "../../../../lib/db.js";

export const dynamic = 'force-dynamic';

// GET /api/bets/check-expired
// Checks for pending bets older than 24 hours and refunds them
export async function GET(request) {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Find pending bets older than 24 hours
    const expiredBets = await prisma.bet.findMany({
      where: {
        status: "pending",
        createdAt: { lt: twentyFourHoursAgo },
      },
      include: {
        creator: { select: { username: true, displayName: true, coins: true } },
        accepter: { select: { username: true, displayName: true } },
      },
    });

    if (expiredBets.length === 0) {
      return Response.json({ message: "No expired bets found" });
    }

    // Refund coins to creators and mark as expired
    const results = [];
    for (const bet of expiredBets) {
      // Refund coins to creator
      await prisma.user.update({
        where: { id: bet.creatorId },
        data: { coins: bet.creator.coins + bet.coinsBet },
      });

      // Update bet status
      const updatedBet = await prisma.bet.update({
        where: { id: bet.id },
        data: { status: "expired" },
      });

      // Notify creator
      await prisma.notification.create({
        data: {
          recipientId: bet.creatorId,
          type: "bet_expired",
          message: `Your bet challenge to ${bet.accepter?.displayName || bet.accepter?.username || "someone"} expired after 24 hours. Your ${bet.coinsBet} coins have been refunded.`,
          metadata: JSON.stringify({
            betId: bet.id,
            coinsRefunded: bet.coinsBet,
          }),
        },
      });

      results.push({
        betId: bet.id,
        coinsRefunded: bet.coinsBet,
      });
    }

    return Response.json({
      message: `Processed ${expiredBets.length} expired bets`,
      results,
    });
  } catch (error) {
    console.error("Error checking expired bets:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
