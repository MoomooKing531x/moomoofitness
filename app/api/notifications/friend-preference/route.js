import { getUserIdFromCookies } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export async function GET(req) {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get("friendId");

    if (!friendId) {
      return Response.json(
        { error: "friendId is required" },
        { status: 400 }
      );
    }

    let preference = await prisma.friendNotificationPreference.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    // If no preference exists, create one with default (enabled = true)
    if (!preference) {
      preference = await prisma.friendNotificationPreference.create({
        data: {
          userId,
          friendId,
          enabled: true,
        },
      });
    }

    return Response.json(preference);
  } catch (error) {
    console.error("Error fetching friend notification preference:", error);
    return Response.json(
      { error: "Failed to fetch preference" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friendId, enabled } = await req.json();

    if (!friendId || enabled === undefined) {
      return Response.json(
        { error: "friendId and enabled are required" },
        { status: 400 }
      );
    }

    let preference = await prisma.friendNotificationPreference.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    if (!preference) {
      preference = await prisma.friendNotificationPreference.create({
        data: {
          userId,
          friendId,
          enabled,
        },
      });
    } else {
      preference = await prisma.friendNotificationPreference.update({
        where: {
          userId_friendId: {
            userId,
            friendId,
          },
        },
        data: { enabled },
      });
    }

    return Response.json(preference);
  } catch (error) {
    console.error("Error updating friend notification preference:", error);
    return Response.json(
      { error: "Failed to update preference" },
      { status: 500 }
    );
  }
}
