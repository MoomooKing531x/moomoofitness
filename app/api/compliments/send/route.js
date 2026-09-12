import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

const COMPLIMENT_OPTIONS = [
  "Keep going! 💪",
  "Nice work! 🌟",
  "You're crushing it! 🔥",
  "Amazing progress! 🎉",
  "Stay consistent! 📈",
  "Inspiring! ⭐",
];

export async function POST(request) {
  try {
    const senderId = getUserIdFromCookies();
    if (!senderId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    const { recipientId, type, customMessage, skipCooldown } = await request.json();

    if (!recipientId) {
      return new Response(JSON.stringify({ error: "Recipient ID required" }), {
        status: 400,
      });
    }

    if (recipientId === senderId) {
      return new Response(JSON.stringify({ error: "Cannot compliment yourself" }), {
        status: 400,
      });
    }

    // Check if users are friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: "accepted",
        OR: [
          { requesterId: senderId, addresseeId: recipientId },
          { requesterId: recipientId, addresseeId: senderId },
        ],
      },
    });

    if (!friendship) {
      return new Response(JSON.stringify({ error: "You can only compliment friends" }), {
        status: 403,
      });
    }

    // Check cooldown
    const existingCooldown = await prisma.complimentCooldown.findUnique({
      where: {
        senderId_recipientId: {
          senderId,
          recipientId,
        },
      },
    });

    const now = new Date();

    if (existingCooldown && existingCooldown.cooldownEndsAt > now) {
      // Cooldown is still active
      if (skipCooldown) {
        // Check if sender has 100 coins to skip
        const senderUser = await prisma.user.findUnique({
          where: { id: senderId },
          select: { coins: true },
        });

        if (!senderUser || senderUser.coins < 100) {
          return new Response(
            JSON.stringify({
              error: "Not enough coins to skip cooldown. Need 100 coins.",
              currentCoins: senderUser?.coins || 0,
            }),
            { status: 400 }
          );
        }

        // Deduct 100 coins
        await prisma.user.update({
          where: { id: senderId },
          data: { coins: { decrement: 100 } },
        });
      } else {
        const timeRemaining = Math.ceil((existingCooldown.cooldownEndsAt - now) / (1000 * 60));
        return new Response(
          JSON.stringify({
            error: `Compliment cooldown active. Wait ${timeRemaining} minutes or pay 100 coins to skip.`,
            cooldownActive: true,
            timeRemainingMinutes: timeRemaining,
          }),
          { status: 429 }
        );
      }
    }

    // Update or create cooldown record (1 hour cooldown)
    const cooldownEndsAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    if (existingCooldown) {
      await prisma.complimentCooldown.update({
        where: { id: existingCooldown.id },
        data: { lastSentAt: now, cooldownEndsAt },
      });
    } else {
      await prisma.complimentCooldown.create({
        data: {
          senderId,
          recipientId,
          lastSentAt: now,
          cooldownEndsAt,
        },
      });
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true, displayName: true },
    });

    // Validate custom message if provided
    if (type === "custom") {
      if (!customMessage || customMessage.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Custom message required" }), {
          status: 400,
        });
      }
      
      const wordCount = customMessage.trim().split(/\s+/).length;
      if (wordCount > 50) {
        return new Response(JSON.stringify({ error: "Custom message must be 50 words or less" }), {
          status: 400,
        });
      }
    }

    // Determine message content
    let message;
    if (type === "custom") {
      message = `💬 ${sender.displayName || sender.username} sent you a custom message: "${customMessage}"`;
    } else if (COMPLIMENT_OPTIONS.includes(type)) {
      message = `💬 ${sender.displayName || sender.username} complimented you: "${type}"`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid compliment type" }), {
        status: 400,
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        recipientId,
        type: "compliment",
        message,
        metadata: JSON.stringify({
          senderId,
          senderUsername: sender.username,
          senderDisplayName: sender.displayName,
          complimentType: type,
          customMessage: type === "custom" ? customMessage : null,
        }),
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Compliment sent successfully!",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending compliment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}