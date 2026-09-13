import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function GET(request) {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return Response.json({ error: "Username required" }, { status: 400 });
  }

  const profileUser = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      age: true,
      gender: true,
      elo: true,
      gp: true,
      coins: true,
      statsVisibility: true,
      currentStreak: true,
      lastLoggedDate: true,
      equippedHat: true,
      equippedJacket: true,
      equippedAccessory: true,
      maxGameLevelReached: true,
    },
  });

  if (!profileUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, elo: true, gp: true, coins: true, currentStreak: true, lastLoggedDate: true, maxGameLevelReached: true },
  });

  if (!viewer) {
    return Response.json({ error: "Viewer not found" }, { status: 404 });
  }

  const isYou = profileUser.id === viewer.id;

  // Check stats privacy
  let canViewStats = isYou;
  if (!isYou) {
    if (profileUser.statsVisibility === "public") {
      canViewStats = true;
    } else if (profileUser.statsVisibility === "friends") {
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: "accepted",
          OR: [
            { requesterId: viewer.id, addresseeId: profileUser.id },
            { requesterId: profileUser.id, addresseeId: viewer.id },
          ],
        },
      });
      canViewStats = !!friendship;
    } else {
      canViewStats = false;
    }
  }

  return Response.json({
    ok: true,
    user: profileUser,
    canViewStats,
  });
}
