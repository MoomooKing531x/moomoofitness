import { getUserIdFromCookies } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export async function POST(req) {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await req.json();

    if (!notificationId) {
      return Response.json(
        { error: "notificationId is required" },
        { status: 400 }
      );
    }

    // Verify the notification belongs to this user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.recipientId !== userId) {
      return Response.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Mark as read
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return Response.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return Response.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
