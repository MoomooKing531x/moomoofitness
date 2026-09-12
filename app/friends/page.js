import { redirect } from "next/navigation";
import { prisma } from "../../lib/db";
import { getUserIdFromCookies } from "../../lib/auth";
import { getStreakDisplay } from "../../lib/streak";
import Navbar from "../../components/Navbar";
import FriendsPanel from "../../components/FriendsPanel";

export default async function FriendsPage() {
  const userId = getUserIdFromCookies();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

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
      <main className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold mb-6">Friends</h1>
        <FriendsPanel />
      </main>
    </div>
  );
}
