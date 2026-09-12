import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import { getUserIdFromCookies } from "../../../lib/auth";
import { getStreakDisplay } from "../../../lib/streak";
import Navbar from "../../../components/Navbar";
import GameLeaderboardContent from "./content";

export default async function GameLeaderboardPage() {
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
      <GameLeaderboardContent />
    </div>
  );
}
