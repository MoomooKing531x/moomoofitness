import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Called internally by logs API when user logs an exercise
export async function POST(request) {
  try {
    const { userId, exerciseId, amount } = await request.json();

    if (!userId || !exerciseId || !amount) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
      });
    }

    // Find all active bets for this exercise that involve this user
    const bets = await prisma.bet.findMany({
      where: {
        exerciseId,
        status: "accepted",
        deadline: {
          gte: new Date(), // Not expired
        },
        OR: [
          { creatorId: userId },
          { accepterId: userId },
        ],
      },
      include: {
        creator: { select: { id: true, username: true, displayName: true } },
        accepter: { select: { id: true, username: true, displayName: true } },
      },
    });

    // Update progress for each relevant bet
    const updates = [];
    for (const bet of bets) {
      const isCreator = bet.creatorId === userId;
      const progressField = isCreator ? "creatorProgress" : "accepterProgress";
      const newProgress = (isCreator ? bet.creatorProgress : bet.accepterProgress) + amount;

      const updated = await prisma.bet.update({
        where: { id: bet.id },
        data: {
          [progressField]: newProgress,
        },
      });

      updates.push(updated);

      // Check if bet is completed (either user reached target)
      if (newProgress >= bet.targetReps) {
        const winner = isCreator ? bet.creator : bet.accepter;
        const loser = isCreator ? bet.accepter : bet.creator;

        // Mark bet as won
        await prisma.bet.update({
          where: { id: bet.id },
          data: {
            status: isCreator ? "creator_won" : "accepter_won",
          },
        });

        // Award coins to winner: get back their bet + opponent's bet
        const totalWinnings = bet.coinsBet * 2;
        const updatedUser = await prisma.user.update({
          where: { id: winner.id },
          data: { coins: { increment: totalWinnings } },
          select: { coins: true },
        });

        // Create notifications
        await prisma.notification.create({
          data: {
            recipientId: winner.id,
            type: "bet_won",
            message: `🎉 You won the bet against ${loser.displayName || loser.username}! You earned ${totalWinnings} coins!`,
            metadata: JSON.stringify({ betId: bet.id }),
          },
        });

        await prisma.notification.create({
          data: {
            recipientId: loser.id,
            type: "bet_lost",
            message: `😢 ${winner.displayName || winner.username} completed the bet first! You lost ${bet.coinsBet} coins.`,
            metadata: JSON.stringify({ betId: bet.id }),
          },
        });

        // Notify UI of bet completion
        // Note: This is an internal API, so we can't dispatch events directly
        // The client will poll for updates
      }
    }

    return new Response(
      JSON.stringify({ success: true, updates }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating bet progress:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
