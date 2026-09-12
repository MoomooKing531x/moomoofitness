import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

const ITEM_COSTS = {
  // Hats
  "cap": 500,
  "sports-cap": 1000,
  "kid-hat": 2000,
  "cowboy-hat": 3000,
  "helmet": 7000,
  "top-hat": 10000,
  // Jackets
  "jersey": 1500,
  "tuxedo": 4500,
  "leather-jacket": 5000,
  "armor": 9000,
  "robe": 15000,
  // Accessories
  "gold-neck": 4500,
  "sunglasses": 6000,
};

const ITEM_NAMES = {
  "cap": "Cap",
  "sports-cap": "Sports Cap",
  "kid-hat": "Kid Hat",
  "cowboy-hat": "Cowboy Hat",
  "helmet": "Helmet",
  "top-hat": "Top Hat",
  "jersey": "Jersey",
  "tuxedo": "Tuxedo",
  "leather-jacket": "Leather Jacket",
  "armor": "Armor",
  "robe": "Robe",
  "gold-neck": "Gold Necklace",
  "sunglasses": "Sunglasses",
};

export async function POST(request) {
  try {
    const senderId = getUserIdFromCookies();

    if (!senderId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { itemId, recipientId, message } = await request.json();

    if (!itemId || !recipientId) {
      return Response.json({ error: "Invalid item or recipient" }, { status: 400 });
    }

    const cost = ITEM_COSTS[itemId];
    if (!cost) {
      return Response.json({ error: "Unknown item" }, { status: 400 });
    }

    // Get sender
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
    });

    if (!sender) {
      return Response.json({ error: "Sender not found" }, { status: 404 });
    }

    // Check sender has enough coins FIRST before other errors
    if (sender.coins < cost) {
      return Response.json(
        { error: `Not enough coins. Need ${cost}, you have ${sender.coins}` },
        { status: 402 }
      );
    }

    // Get recipient
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return Response.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Create gift record
    const gift = await prisma.gift.create({
      data: {
        senderId,
        recipientId,
        itemId,
        itemName: ITEM_NAMES[itemId],
        itemCost: cost,
        message: message || null,
      },
    });

    // Deduct coins from sender
    const updatedSender = await prisma.user.update({
      where: { id: senderId },
      data: { coins: sender.coins - cost },
      select: { coins: true },
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        recipientId,
        type: "gift_received",
        message: `${sender.displayName || sender.username} sent you a ${ITEM_NAMES[itemId]}!${message ? ` "${message}"` : ""}`,
        metadata: JSON.stringify({
          senderUsername: sender.username,
          senderDisplayName: sender.displayName,
          itemId,
          itemName: ITEM_NAMES[itemId],
          giftId: gift.id,
        }),
      },
    });

    return Response.json(
      {
        success: true,
        gift,
        coins: updatedSender.coins,
        message: `Gift sent to ${recipient.username}!`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending gift:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
