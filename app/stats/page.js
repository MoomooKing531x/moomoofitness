import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../lib/db";
import { getUserIdFromCookies } from "../../lib/auth";
import Navbar from "../../components/Navbar";
import { getStreakDisplay } from "../../lib/streak";
import ResetAccountButton from "../../components/ResetAccountButton";

export default async function StatsPage() {
  const userId = getUserIdFromCookies();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) redirect("/login");

  const { streak, status } = getStreakDisplay(user);

  // Get all exercises the user has logged
  const exercisesLogged = await prisma.exercise.findMany({
    where: {
      logs: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      unit: true,
      _count: {
        select: { logs: { where: { userId } } },
      },
    },
    orderBy: { name: "asc" },
  });

  // Get total stats
  const allLogs = await prisma.log.findMany({
    where: { userId },
    select: { amount: true },
  });

  const totalLogged = allLogs.reduce((sum, log) => sum + log.amount, 0);

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
      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/dashboard" className="text-sm text-gray-500 underline mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">Your Stats</h1>
        <p className="text-gray-600 mb-10">View your progress across all exercises with interactive graphs</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-gray-600">Total Logged</p>
            <p className="text-4xl font-bold text-blue-600">{totalLogged}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-sm text-gray-600">Exercises Tracked</p>
            <p className="text-4xl font-bold text-green-600">{exercisesLogged.length}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <p className="text-sm text-gray-600">Current Streak</p>
            <p className="text-4xl font-bold text-purple-600">{streak} days</p>
          </div>
        </div>

        {/* Exercises List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Exercise Progress</h2>
          {exercisesLogged.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border">
              <p className="text-gray-600">No exercises logged yet.</p>
              <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
                Start logging workouts →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exercisesLogged.map((exercise) => (
                <Link
                  key={exercise.id}
                  href={`/stats/${exercise.id}`}
                  className="bg-white border rounded-lg p-6 hover:shadow-lg hover:border-blue-500 transition cursor-pointer group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition mb-2">
                    {exercise.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {exercise._count.logs} log{exercise._count.logs === 1 ? "" : "s"}
                  </p>
                  <div className="text-sm text-blue-600 font-medium">
                    View Graph →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <ResetAccountButton />
      </main>
    </div>
  );
}
