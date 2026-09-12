import { getUserIdFromCookies } from "../../../lib/auth";
import { prisma } from "../../../lib/db";

export async function GET(req) {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get unread notifications count and recent notifications
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Get last 50 notifications
    });

    return Response.json({
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return Response.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
