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
        creator: { select: { username: true, displayName: true } },
        exercise: { select: { name: true, unit: true } },
      },
    });

    if (!bet) {
      return Response.json({ error: "Bet not found" }, { status: 404 });
    }

    // Verify this is the correct accepter
    if (bet.accepterId !== accepterId) {
      return Response.json({ error: "Not your bet to accept" }, { status: 403 });
    }

    // Verify bet is still pending
    if (bet.status !== "pending") {
      return Response.json({ error: "Bet is no longer pending" }, { status: 400 });
    }

    // Get accepter and check coins
    const accepter = await prisma.user.findUnique({
      where: { id: accepterId },
      select: { username: true, displayName: true, coins: true }
    });

    if (!accepter) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (accepter.coins < bet.coinsBet) {
      return Response.json(
        { 
          error: `Not enough coins to accept bet. Need ${bet.coinsBet}, you have ${accepter.coins}`,
          required: bet.coinsBet,
          have: accepter.coins 
        },
        { status: 402 }
      );
    }

    // Deduct coins from accepter and update bet status
    await prisma.user.update({
      where: { id: accepterId },
      data: { coins: accepter.coins - bet.coinsBet },
    });

    const updatedBet = await prisma.bet.update({
      where: { id: betId },
      data: { status: "accepted" },
      include: {
        creator: { select: { username: true, displayName: true } },
        accepter: { select: { username: true, displayName: true } },
        exercise: { select: { name: true } },
      },
    });

    // Notify creator that bet was accepted
    await prisma.notification.create({
      data: {
        recipientId: bet.creatorId,
        type: "bet_accepted",
        message: `${accepter.displayName || accepter.username} accepted your bet! Challenge begins now!`,
        metadata: JSON.stringify({
          betId: bet.id,
          accepterUsername: accepter.username,
          accepterDisplayName: accepter.displayName,
          exerciseUnit: bet.exercise.unit,
        }),
      },
    });

    return Response.json(
      {
        success: true,
        bet: updatedBet,
        message: "Bet accepted! The challenge begins!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error accepting bet:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
