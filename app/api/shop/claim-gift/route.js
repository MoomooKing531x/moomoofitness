import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    const { giftId } = await request.json();

    if (!giftId) {
      return new Response(JSON.stringify({ error: "Invalid gift ID" }), {
        status: 400,
      });
    }

    // Get gift
    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
    });

    if (!gift) {
      return new Response(JSON.stringify({ error: "Gift not found" }), {
        status: 404,
      });
    }

    // Check recipient
    if (gift.recipientId !== userId) {
      return new Response(JSON.stringify({ error: "Not your gift" }), {
        status: 403,
      });
    }

    // Check if already claimed
    if (gift.claimedAt) {
      return new Response(JSON.stringify({ error: "Gift already claimed" }), {
        status: 409,
      });
    }

    // Get user and parse owned items
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    let ownedItems = [];
    try {
      ownedItems = JSON.parse(user.ownedItems || "[]");
    } catch {
      ownedItems = [];
    }

    // Add item to owned items if not already owned
    if (!ownedItems.includes(gift.itemId)) {
      ownedItems.push(gift.itemId);
    }

    // Update gift as claimed and update user inventory
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ownedItems: JSON.stringify(ownedItems),
      },
    });

    await prisma.gift.update({
      where: { id: giftId },
      data: { claimedAt: new Date() },
    });

    return new Response(
      JSON.stringify({
        success: true,
        itemId: gift.itemId,
        itemName: gift.itemName,
        ownedItems,
        message: `You received ${gift.itemName}!`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error claiming gift:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
