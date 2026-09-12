import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    // Get all unclaimed gifts for this user
    const gifts = await prisma.gift.findMany({
      where: {
        recipientId: userId,
        claimedAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return new Response(JSON.stringify({ gifts }), { status: 200 });
  } catch (error) {
    console.error("Error fetching gifts:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
