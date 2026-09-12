import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function POST(request) {
  try {
    const userId = getUserIdFromCookies();

    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { betId } = await request.json();

    if (!betId) {
      return Response.json({ error: "Bet ID required" }, { status: 400 });
    }

    // Get bet
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      return Response.json({ error: "Bet not found" }, { status: 404 });
    }

    // Verify this bet belongs to the user
    if (bet.creatorId !== userId && bet.accepterId !== userId) {
      return Response.json({ error: "Not your bet to dismiss" }, { status: 403 });
    }

    // Update bet to mark as dismissed
    await prisma.bet.update({
      where: { id: betId },
      data: { dismissedAt: new Date() },
    });

    return Response.json(
      {
        success: true,
        message: "Bet dismissed.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error dismissing bet:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
