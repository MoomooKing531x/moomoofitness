import { redirect } from "next/navigation";
import RepDefenseGame from "../../components/RepDefenseGame";
import Navbar from "../../components/Navbar";
import { prisma } from "../../lib/db";
import { getUserIdFromCookies } from "../../lib/auth";
import { getStreakDisplay } from "../../lib/streak";

export default async function GamePage() {
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
      <RepDefenseGame />
    </div>
  );
}
