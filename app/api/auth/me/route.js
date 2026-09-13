import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function GET() {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      currentStreak: true,
      longestStreak: true,
      lastLoggedDate: true,
      ownedItems: true,
      equippedHat: true,
      equippedJacket: true,
      equippedAccessory: true,
      elo: true,
      gp: true,
      coins: true,
      maxGameLevelReached: true,
    },
  });

  if (!user) {
    return Response.json({ ok: false, user: null });
  }

  return Response.json({ ok: true, user });
}

