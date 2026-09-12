import { prisma } from "./db.js";

/**
 * Create a "friend catching up" notification
 * Called when a friend's ELO gets close to or surpasses user's ELO
 */
export async function notifyFriendCatchingUp(userId, friendId, friendUsername, friendElo, userElo) {
  try {
    // Check if user has notifications enabled for this friend
    let preference = await prisma.friendNotificationPreference.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    // Default is enabled if no preference exists
    if (!preference || preference.enabled) {
      const message = `🏆 ${friendUsername} is catching up! They now have ${friendElo} ELO (you have ${userElo})`;
      
      await prisma.notification.create({
        data: {
          recipientId: userId,
          type: "friend_catching_up",
          message,
          metadata: JSON.stringify({
            friendId,
            friendUsername,
            friendElo,
            userElo,
          }),
        },
      });
    }
  } catch (error) {
    console.error("Error creating friend catching up notification:", error);
  }
}

/**
 * Create a streak milestone notification
 * Called when friend reaches milestone streaks (5, 10, 25, 50, 100 days, etc.)
 */
export async function notifyStreakMilestone(userId, friendId, friendUsername, streakDays) {
  try {
    let preference = await prisma.friendNotificationPreference.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    if (!preference || preference.enabled) {
      const message = `🔥 ${friendUsername} just hit a ${streakDays}-day streak!`;
      
      await prisma.notification.create({
        data: {
          recipientId: userId,
          type: "streak_milestone",
          message,
          metadata: JSON.stringify({
            friendId,
            friendUsername,
            streakDays,
          }),
        },
      });
    }
  } catch (error) {
    console.error("Error creating streak milestone notification:", error);
  }
}

/**
 * Create a missed day notification
 * Called when user hasn't logged anything today
 */
export async function notifyMissedDay(userId) {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if user has logged anything today
    const logToday = await prisma.log.findFirst({
      where: {
        userId,
        date: {
          gte: today,
        },
      },
    });

    // Only notify if they haven't logged today
    if (!logToday) {
      // Check if we already sent this notification today
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          recipientId: userId,
          type: "missed_day",
          createdAt: {
            gte: today,
          },
        },
      });

      if (!alreadyNotified) {
        const message = `😢 You missed a day! But don't worry, today is a new day to build your streak back up!`;
        
        await prisma.notification.create({
          data: {
            recipientId: userId,
            type: "missed_day",
            message,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error creating missed day notification:", error);
  }
}

/**
 * Notify friends when you hit a streak milestone
 * Called when user reaches milestone streaks
 */
export async function notifyFriendsOfStreak(userId, username, streakDays) {
  try {
    // Find all friendships where this user is involved
    const friendships = await prisma.friendship.findMany({
      where: {
        AND: [
          { status: "accepted" },
          {
            OR: [{ requesterId: userId }, { addresseeId: userId }],
          },
        ],
      },
      include: {
        requester: { select: { id: true, username: true } },
        addressee: { select: { id: true, username: true } },
      },
    });

    // Get list of friend IDs
    const friendIds = friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    // Create notifications for all friends
    for (const friendId of friendIds) {
      await notifyStreakMilestone(friendId, userId, username, streakDays);
    }
  } catch (error) {
    console.error("Error notifying friends of streak:", error);
  }
}

/**
 * Check if milestone streak (5, 10, 25, 50, 100, etc.)
 */
export function isStreakMilestone(streak) {
  if (streak === 0) return false;
  // Milestones: 5, 10, 25, 50, 100, 250, 500, 1000
  const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
  return milestones.includes(streak);
}

/**
 * Check if friend is catching up (within 50 ELO of user)
 */
export async function checkIfFriendCatchingUp(userId, friendId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { elo: true },
    });

    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: { elo: true },
    });

    if (!user || !friend) return false;

    // Friend is catching up if they're within 50 ELO and not already ahead
    const diff = user.elo - friend.elo;
    return diff >= 0 && diff <= 50;
  } catch (error) {
    console.error("Error checking if friend catching up:", error);
    return false;
  }
}

