import { prisma, bcrypt } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function POST(request) {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ error: "Username and password required" }, { status: 400 });
    }

    // Get user to verify credentials
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, passwordHash: true },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Verify username matches
    if (username !== user.username) {
      return Response.json({ error: "Incorrect username" }, { status: 403 });
    }

    // Verify password matches
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return Response.json({ error: "Incorrect password" }, { status: 403 });
    }

    // Delete all logs for this user
    await prisma.log.deleteMany({
      where: { userId },
    });

    // Delete all bets where user is creator or accepter
    await prisma.bet.deleteMany({
      where: {
        OR: [{ creatorId: userId }, { accepterId: userId }],
      },
    });

    // Delete all friendships where user is involved
    await prisma.friendship.deleteMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });

    // Delete all notifications for this user
    await prisma.notification.deleteMany({
      where: { userId },
    });

    // Delete all game runs for this user
    await prisma.gameRun.deleteMany({
      where: { userId },
    });

    // Reset user stats
    await prisma.user.update({
      where: { id: userId },
      data: {
        elo: 0,
        gp: 0,
        coins: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalWorkoutDaysDone: 0,
        lastLoggedDate: null,
        ownedItems: "[]",
        equippedHat: null,
        equippedJacket: null,
        equippedAccessory: null,
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error resetting user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
