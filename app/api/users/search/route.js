import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// GET /api/users/search?q=username
// Search for users by username
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim().toLowerCase();

  if (!query || query.length < 2) {
    return Response.json({ users: [] });
  }

  const currentUserId = getUserIdFromCookies();

  const users = await prisma.user.findMany({
    where: {
      username: {
        contains: query,
        mode: 'insensitive'
      },
      ...(currentUserId ? { id: { not: currentUserId } } : {})
    },
    select: {
      id: true,
      username: true,
      displayName: true
    },
    take: 10
  });

  return Response.json({ users });
}
