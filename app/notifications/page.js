import { redirect } from "next/navigation";
import { prisma } from "../../lib/db";
import { getUserIdFromCookies } from "../../lib/auth";
import Navbar from "../../components/Navbar";
import NotificationsClient from "../../components/NotificationsClient";
import { getStreakDisplay } from "../../lib/streak";

export default async function NotificationsPage() {
  const userId = getUserIdFromCookies();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
  });

  const gifts = await prisma.gift.findMany({
    where: { recipientId: userId },
    include: { sender: true },
    orderBy: { createdAt: "desc" },
  });

  const { streak, status } = getStreakDisplay(user);

  return (
    <div>
      <Navbar
        username={user.username}
        displayName={user.displayName}
        currentStreak={streak}
        streakStatus={status}
        elo={user.elo || 0}
        coins={user.coins || 0}
      />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-2">Notifications</h1>
        <p className="text-gray-600 mb-8">Stay updated with activity from friends and gifts!</p>

        <NotificationsClient initialNotifications={notifications} initialGifts={gifts} />
      </main>
    </div>
  );
}
