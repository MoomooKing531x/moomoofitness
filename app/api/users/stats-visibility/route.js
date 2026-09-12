import { getUserIdFromCookies } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export async function GET(req) {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { statsVisibility: true },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ statsVisibility: user.statsVisibility });
  } catch (error) {
    console.error("Error fetching stats visibility:", error);
    return Response.json(
      { error: "Failed to fetch stats visibility" },
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

    const { statsVisibility } = await req.json();

    if (!["public", "friends", "nobody"].includes(statsVisibility)) {
      return Response.json(
        { error: "Invalid statsVisibility value" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { statsVisibility },
      select: { statsVisibility: true },
    });

    return Response.json({ statsVisibility: user.statsVisibility });
  } catch (error) {
    console.error("Error updating stats visibility:", error);
    return Response.json(
      { error: "Failed to update stats visibility" },
      { status: 500 }
    );
  }
}
