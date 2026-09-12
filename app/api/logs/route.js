import { getUserIdFromCookies } from "../../../lib/auth.js";
import { resolveExercise, recordLog } from "../../../lib/logging.js";
import { calculatePoints, calculateElo } from "../../../lib/points.js";
import { prisma } from "../../../lib/db.js";
import {
  notifyMissedDay,
  notifyFriendsOfStreak,
  isStreakMilestone,
  checkIfFriendCatchingUp,
  notifyFriendCatchingUp,
} from "../../../lib/notifications.js";

// POST /api/logs — either { exerciseId, amount, reps, sets } or { customName, amount, reps, sets }
export async function POST(request) {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Not logged in." }, { status: 401 });
    }

    const { exerciseId, customName, amount, reps, sets } = await request.json();
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return Response.json({ error: "A positive amount is required." }, { status: 400 });
    }

    let exercise;
    try {
      exercise = await resolveExercise({ exerciseId, customName, userId });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 400 });
    }

    const { currentStreak, longestStreak } = await recordLog({
      userId,
      exercise,
      amount: parsedAmount,
      reps: reps || null,
      sets: sets || null,
    });

    // Calculate ELO based on exercise multiplier
    const eloEarned = calculateElo(exercise, parsedAmount);
    
    // Update bet progress for any active bets
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/bets/update-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          exerciseId: exercise.id,
          amount: parsedAmount,
        }),
      });
    } catch (error) {
      console.error("Error updating bet progress:", error);
      // Don't fail the log if bet update fails
    }
    
    // Check if this is a new workout day (first log of the day for this user)
    const logsToday = await prisma.log.findMany({
      where: {
        userId,
        date: {
          gte: new Date(new Date().toDateString()),
          lt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        },
      },
      take: 1,
    });
    
    const isNewWorkoutDay = logsToday.length === 0;
    
    // Update user ELO (exercise points) and GP (game points) and workout day count
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        elo: { increment: eloEarned },
        gp: { increment: eloEarned }, // GP matches ELO for game purchases
        ...(isNewWorkoutDay && { totalWorkoutDaysDone: { increment: 1 } }),
      },
      select: { elo: true, gp: true, coins: true },
    });

    // Trigger notifications
    try {
      // Get user info for notifications
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, elo: true },
      });

      // 1. Check if streak is a milestone
      if (isStreakMilestone(currentStreak)) {
        // Notify all friends about this milestone
        await notifyFriendsOfStreak(userId, user.username, currentStreak);
      }

      // 2. Check if any friends are catching up
      const acceptedFriendships = await prisma.friendship.findMany({
        where: {
          status: "accepted",
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
      });

      for (const friendship of acceptedFriendships) {
        const friendId = friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId;
        
        // Check if friend is catching up
        if (await checkIfFriendCatchingUp(userId, friendId)) {
          const friend = await prisma.user.findUnique({
            where: { id: friendId },
            select: { username: true, elo: true },
          });
          
          await notifyFriendCatchingUp(
            friendId,
            userId,
            user.username,
            user.elo,
            friend.elo
          );
        }
      }

      // 3. Notify user if they missed a day (only check on first log of the day)
      await notifyMissedDay(userId);
    } catch (error) {
      console.error("Error triggering notifications:", error);
      // Don't fail the request if notification fails
    }

    return Response.json({
      ok: true,
      currentStreak,
      longestStreak,
      exercise: { id: exercise.id, name: exercise.name, isPublic: exercise.isPublic },
      eloEarned,
      userElo: updatedUser.elo,
      userGp: updatedUser.gp,
      userCoins: updatedUser.coins,
    });
  } catch (error) {
    console.error("Error in POST /api/logs:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ logs: [] });
    }

    const logs = await prisma.log.findMany({
      where: { userId },
      include: { exercise: true },
      orderBy: { loggedAt: "desc" },
      take: 100,
    });

    return Response.json({ logs });
  } catch (error) {
    console.error("Error in GET /api/logs:", error);
    return Response.json({ logs: [] });
  }
}
