import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// GET /api/friends/list
// Returns list of accepted friends
export async function GET(request) {
  const currentUserId = getUserIdFromCookies();

  if (!currentUserId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
    },
    include: {
      requester: {
        select: { id: true, username: true, displayName: true }
      },
      addressee: {
        select: { id: true, username: true, displayName: true }
      }
    }
  });

  const friends = friendships.map(f => ({
    id: f.requesterId === currentUserId ? f.addressee.id : f.requester.id,
    username: f.requesterId === currentUserId ? f.addressee.username : f.requester.username,
    displayName: f.requesterId === currentUserId ? f.addressee.displayName : f.requester.displayName
  }));

  return Response.json({ friends });
}
