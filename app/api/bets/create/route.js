import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function POST(request) {
  try {
    const creatorId = getUserIdFromCookies();

    if (!creatorId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { accepterId, exerciseId, targetReps, daysUntilDeadline, coinsBet } = await request.json();

    if (!accepterId || !exerciseId || !targetReps || !daysUntilDeadline || !coinsBet) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (targetReps <= 0 || coinsBet <= 0 || daysUntilDeadline <= 0) {
      return Response.json({ error: "Values must be positive" }, { status: 400 });
    }

    // Get creator
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check creator has enough coins
    if (creator.coins < coinsBet) {
      return Response.json(
        { error: `Not enough coins. Need ${coinsBet}, you have ${creator.coins}` },
        { status: 402 }
      );
    }

    // Verify accepter exists
    const accepter = await prisma.user.findUnique({
      where: { id: accepterId },
    });

    if (!accepter) {
      return Response.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Verify exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      return Response.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Calculate deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysUntilDeadline);

    // Create bet and deduct coins from creator
    const bet = await prisma.bet.create({
      data: {
        creatorId,
        accepterId,
        exerciseId,
        targetReps,
        deadline,
        coinsBet,
        status: "pending",
      },
      include: {
        creator: { select: { username: true, displayName: true } },
        accepter: { select: { username: true, displayName: true } },
        exercise: { select: { name: true } },
      },
    });

    // Deduct coins from creator (they're putting up the bet)
    await prisma.user.update({
      where: { id: creatorId },
      data: { coins: creator.coins - coinsBet },
    });

    // Create notification for accepter
    await prisma.notification.create({
      data: {
        recipientId: accepterId,
        type: "bet_requested",
        message: `${creator.displayName || creator.username} challenged you to a bet: ${targetReps} ${exercise.unit} ${exercise.name} in ${daysUntilDeadline} days for ${coinsBet} coins!`,
        metadata: JSON.stringify({
          betId: bet.id,
          creatorUsername: creator.username,
          creatorDisplayName: creator.displayName,
          exerciseName: exercise.name,
          exerciseUnit: exercise.unit,
          targetReps,
          daysUntilDeadline,
          coinsBet,
        }),
      },
    });

    return Response.json(
      {
        success: true,
        bet,
        message: "Bet sent!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bet:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
