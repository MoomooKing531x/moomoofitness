import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// Categorize items
const ITEM_CATEGORIES = {
  hats: new Set(["cap", "sports-cap", "kid-hat", "cowboy-hat", "helmet", "top-hat"]),
  jackets: new Set(["jersey", "tuxedo", "leather-jacket", "armor", "robe"]),
  accessories: new Set(["gold-neck", "sunglasses"]),
};

function getItemCategory(itemId) {
  for (const [category, items] of Object.entries(ITEM_CATEGORIES)) {
    if (items.has(itemId)) return category;
  }
  return null;
}

export async function POST(request) {
  try {
    const userId = getUserIdFromCookies();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return new Response(JSON.stringify({ error: "Invalid item ID" }), {
        status: 400,
      });
    }

    // Determine category
    const category = getItemCategory(itemId);
    if (!category) {
      return new Response(JSON.stringify({ error: "Unknown item" }), {
        status: 400,
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Check if user owns the item
    let ownedItems = [];
    try {
      ownedItems = JSON.parse(user.ownedItems || "[]");
    } catch {
      ownedItems = [];
    }

    if (!ownedItems.includes(itemId)) {
      return new Response(JSON.stringify({ error: "Item not owned" }), {
        status: 403,
      });
    }

    // Update equipped item based on category
    const updateData = {};
    if (category === "hats") {
      updateData.equippedHat = itemId;
    } else if (category === "jackets") {
      updateData.equippedJacket = itemId;
    } else if (category === "accessories") {
      updateData.equippedAccessory = itemId;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        equippedHat: updated.equippedHat,
        equippedJacket: updated.equippedJacket,
        equippedAccessory: updated.equippedAccessory,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error equipping item:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
