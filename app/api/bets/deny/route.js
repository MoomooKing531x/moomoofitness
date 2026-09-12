import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function POST(request) {
  try {
    const accepterId = getUserIdFromCookies();

    if (!accepterId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { betId } = await request.json();

    if (!betId) {
      return Response.json({ error: "Bet ID required" }, { status: 400 });
    }

    // Get bet
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: {
        creator: { select: { username: true, displayName: true, coins: true } },
        exercise: { select: { name: true } },
      },
    });

    if (!bet) {
      return Response.json({ error: "Bet not found" }, { status: 404 });
    }

    // Verify this is the correct accepter
    if (bet.accepterId !== accepterId) {
      return Response.json({ error: "Not your bet to deny" }, { status: 403 });
    }

    // Verify bet is still pending
    if (bet.status !== "pending") {
      return Response.json({ error: "Bet is no longer pending" }, { status: 400 });
    }

    // Refund coins to creator
    await prisma.user.update({
      where: { id: bet.creatorId },
      data: { coins: bet.creator.coins + bet.coinsBet },
    });

    // Update bet status to denied
    const updatedBet = await prisma.bet.update({
      where: { id: betId },
      data: { status: "denied" },
      include: {
        creator: { select: { username: true, displayName: true } },
        accepter: { select: { username: true, displayName: true } },
        exercise: { select: { name: true } },
      },
    });

    // Notify creator that bet was denied
    await prisma.notification.create({
      data: {
        recipientId: bet.creatorId,
        type: "bet_denied",
        message: `${bet.accepter?.displayName || bet.accepter?.username || "Someone"} denied your bet challenge! Your ${bet.coinsBet} coins have been refunded.`,
        metadata: JSON.stringify({
          betId: bet.id,
          coinsRefunded: bet.coinsBet,
        }),
      },
    });

    return Response.json(
      {
        success: true,
        bet: updatedBet,
        message: "Bet denied. Coins refunded to challenger.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error denying bet:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
