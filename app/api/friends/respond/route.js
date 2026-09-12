import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// POST /api/friends/respond { friendshipId, accept: boolean }
export async function POST(request) {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Not logged in." }, { status: 401 });

  const { friendshipId, accept } = await request.json();
  if (!friendshipId) return Response.json({ error: "friendshipId required." }, { status: 400 });

  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || friendship.addresseeId !== userId) {
    return Response.json({ error: "Request not found." }, { status: 404 });
  }

  if (accept) {
    await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: "accepted" },
    });

    // Get both users' info for notification
    const requester = await prisma.user.findUnique({
      where: { id: friendship.requesterId },
      select: { username: true, displayName: true },
    });
    const accepter = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, displayName: true },
    });

    // Notify the requester that their request was accepted
    await prisma.notification.create({
      data: {
        recipientId: friendship.requesterId,
        type: "friend_accepted",
        message: `${accepter.displayName || accepter.username} accepted your friend request!`,
        metadata: JSON.stringify({ userId, username: accepter.username }),
      },
    });
  } else {
    await prisma.friendship.delete({ where: { id: friendshipId } });
  }

  return Response.json({ ok: true });
}

