import { prisma } from "../../../lib/db.js";
import { getUserIdFromCookies } from "../../../lib/auth.js";

// GET /api/friends -> your accepted friends + incoming pending requests
export async function GET() {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Not logged in." }, { status: 401 });

  const accepted = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { 
        select: { id: true, username: true, displayName: true, elo: true, coins: true } 
      },
      addressee: { 
        select: { id: true, username: true, displayName: true, elo: true, coins: true } 
      },
    },
  });

  const friends = accepted.map((f) =>
    f.requesterId === userId ? f.addressee : f.requester
  );

  const incoming = await prisma.friendship.findMany({
    where: { addresseeId: userId, status: "pending" },
    include: { requester: { select: { id: true, username: true } } },
  });

  return Response.json({
    friends,
    incomingRequests: incoming.map((r) => ({
      friendshipId: r.id,
      fromUserId: r.requester.id,
      fromUsername: r.requester.username,
    })),
  });
}

