import { getUserIdFromCookies } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export async function POST(req) {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientId, type, message, metadata } = await req.json();

    if (!recipientId || !type || !message) {
      return Response.json(
        { error: "recipientId, type, and message are required" },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        type,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    return Response.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
