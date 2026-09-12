import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../lib/db";
import { getUserIdFromCookies } from "../../lib/auth";
import { getStreakDisplay } from "../../lib/streak";
import { getRandomWelcomeMessage } from "../../lib/welcomeMessages";
import Navbar from "../../components/Navbar";
import DashboardClient from "../../components/DashboardClient";
import LogForm from "../../components/LogForm";
import DailyChallengeCard from "../../components/DailyChallengeCard";
import BetsPanel from "../../components/BetsPanel";
import OnboardingModal from "../../components/OnboardingModal";
import RecentExercises from "../../components/RecentExercises";
import WeeklyPrompts from "../../components/WeeklyPrompts";

export default async function DashboardPage() {
  const userId = getUserIdFromCookies();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const { streak, status } = getStreakDisplay(user);

  const exercises = await prisma.exercise.findMany({
    where: { isPublic: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

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
      {!user.onboardingCompleted && <OnboardingModal userId={userId} />}
      <DashboardClient>
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Link href="/workouts" className="text-sm text-gray-500 underline mb-6 inline-block">
            ← Back to Workouts
          </Link>
          {user.displayName && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h1 className="text-2xl font-bold text-blue-900">
                Welcome, {user.displayName}!
              </h1>
              <p className="text-sm text-blue-800 mt-1">
                {getRandomWelcomeMessage()}
              </p>
            </div>
          )}
          <WeeklyPrompts />
          <DailyChallengeCard />

          <div className="flex gap-6 mt-6">
            {/* Left column - Log form */}
            <div className="flex-1">
              <h1 className="text-xl font-semibold mb-1">Enter amount you did today</h1>
              <p className="text-sm text-gray-500 mb-6">
                Pick an exercise, enter your amount, and press Insert. Be honest with yourself.
              </p>
              <LogForm exercises={exercises} />

              <div className="mt-10 border-t pt-6">
                <h2 className="text-sm font-semibold text-gray-500 mb-3">Active Bets</h2>
                <BetsPanel />
              </div>

              <div className="mt-10 border-t pt-6">
                <h2 className="text-sm font-semibold text-gray-500 mb-3">Rep Defense Game</h2>
                <Link
                  href="/game"
                  className="inline-block px-4 py-2 rounded-md border border-gray-300 text-sm hover:border-gray-500 bg-orange-50"
                >
                  Play Rep Defense →
                </Link>
                <p className="text-xs text-gray-500 mt-2">
                  Convert your exercise reps into game points and battle enemies!
                </p>
              </div>

              <div className="mt-10 border-t pt-6">
                <h2 className="text-sm font-semibold text-gray-500 mb-3">Leaderboards</h2>
                <div className="flex flex-wrap gap-2">
                  {exercises.map((ex) => (
                    <Link
                      key={ex.id}
                      href={`/leaderboard/${ex.id}`}
                      className="px-3 py-2 rounded-md border border-gray-300 text-sm hover:border-gray-500"
                    >
                      {ex.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column - Recent exercises */}
            <div className="w-80 flex-shrink-0">
              <RecentExercises exercises={exercises} />
            </div>
          </div>
        </main>
      </DashboardClient>
    </div>
  );
}
