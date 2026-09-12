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
      ownedItems: true,
      equippedHat: true,
      equippedJacket: true,
      equippedAccessory: true,
      coins: true,
    },
  });

  return Response.json({ user });
}

