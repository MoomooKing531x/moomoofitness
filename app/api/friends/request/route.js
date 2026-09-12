import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// POST /api/friends/request { username }
export async function POST(request) {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Not logged in." }, { status: 401 });

  const { username } = await request.json();
  if (!username) return Response.json({ error: "Username required." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) return Response.json({ error: "User not found." }, { status: 404 });
  if (target.id === userId) {
    return Response.json({ error: "You can't friend yourself." }, { status: 400 });
  }

  // Already friends or a request already exists in either direction?
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: target.id },
        { requesterId: target.id, addresseeId: userId },
      ],
    },
  });
  if (existing) {
    return Response.json(
      { error: existing.status === "accepted" ? "Already friends." : "Request already pending." },
      { status: 409 }
    );
  }

  // Create friendship
  await prisma.friendship.create({
    data: { requesterId: userId, addresseeId: target.id, status: "pending" },
  });

  // Get sender info for notification
  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, displayName: true },
  });

  // Send notification to recipient
  await prisma.notification.create({
    data: {
      recipientId: target.id,
      type: "friend_request",
      message: `Friend request from ${sender.displayName || sender.username}!`,
      metadata: JSON.stringify({ requesterId: userId, username: sender.username }),
    },
  });

  return Response.json({ ok: true });
}

