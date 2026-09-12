import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// GET /api/logs/list - Get user's logs (for leaderboard exercise sorting)
export async function GET() {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ logs: [] });
    }

    const logs = await prisma.log.findMany({
      where: { userId },
      select: {
        id: true,
        exerciseId: true,
        amount: true,
        reps: true,
        sets: true,
        date: true,
      },
      orderBy: { loggedAt: "desc" },
      take: 1000, // Get last 1000 logs
    });

    return Response.json({ logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return Response.json({ logs: [] });
  }
}

