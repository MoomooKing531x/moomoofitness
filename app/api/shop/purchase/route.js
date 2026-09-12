import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function POST(request) {
  try {
    const userId = getUserIdFromCookies();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    const { itemId, cost } = await request.json();

    if (!itemId || typeof cost !== "number" || cost <= 0) {
      return new Response(JSON.stringify({ error: "Invalid item or cost" }), {
        status: 400,
      });
    }

    // Get user and check coins
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    if (user.coins < cost) {
      return new Response(
        JSON.stringify({ error: "Insufficient coins", required: cost, have: user.coins }),
        { status: 402 }
      );
    }

    // Parse owned items
    let ownedItems = [];
    try {
      ownedItems = JSON.parse(user.ownedItems || "[]");
    } catch {
      ownedItems = [];
    }

    // Check if already owned
    if (ownedItems.includes(itemId)) {
      return new Response(JSON.stringify({ error: "Item already owned" }), {
        status: 409,
      });
    }

    // Add to owned items and deduct coins
    ownedItems.push(itemId);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        coins: user.coins - cost,
        ownedItems: JSON.stringify(ownedItems),
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        coins: updated.coins,
        ownedItems,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error purchasing item:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
