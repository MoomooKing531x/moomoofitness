import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../../lib/db";
import { getUserIdFromCookies } from "../../../lib/auth";
import Navbar from "../../../components/Navbar";
import StatsGraph from "../../../components/StatsGraph";
import { getStreakDisplay } from "../../../lib/streak";

export default async function ExerciseStatsPage({ params }) {
  const userId = getUserIdFromCookies();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) redirect("/login");

  const { streak, status } = getStreakDisplay(user);

  // Get the exercise
  const exercise = await prisma.exercise.findUnique({
    where: { id: params.exerciseId },
    select: {
      id: true,
      name: true,
      unit: true,
      category: true,
    },
  });

  if (!exercise) {
    redirect("/stats");
  }

  // Get all logs for this exercise
  const logs = await prisma.log.findMany({
    where: {
      userId,
      exerciseId: params.exerciseId,
    },
    select: {
      amount: true,
      reps: true,
      sets: true,
      loggedAt: true,
    },
    orderBy: { loggedAt: "desc" },
    take: 100,
  });

  const totalAmount = logs.reduce((sum, log) => sum + log.amount, 0);
  const averageAmount = logs.length > 0 ? Math.round(totalAmount / logs.length) : 0;
  const maxAmount = logs.length > 0 ? Math.max(...logs.map((l) => l.amount)) : 0;

  // Debug logging
  console.log(`Stats for ${exercise.name}:`, {
    logCount: logs.length,
    amounts: logs.map(l => l.amount),
    totalAmount,
    averageAmount,
    maxAmount,
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
      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/stats" className="text-sm text-gray-500 underline mb-6 inline-block">
          ← Back to Stats
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">{exercise.name}</h1>
          <p className="text-gray-600">
            Category: <span className="font-semibold capitalize">{exercise.category}</span> •
            Unit: <span className="font-semibold capitalize">{exercise.unit}</span>
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 uppercase">Total</p>
            <p className="text-3xl font-bold text-blue-600">{totalAmount}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 uppercase">Average</p>
            <p className="text-3xl font-bold text-green-600">{averageAmount}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 uppercase">Max</p>
            <p className="text-3xl font-bold text-purple-600">{maxAmount}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 uppercase">Logs</p>
            <p className="text-3xl font-bold text-orange-600">{logs.length}</p>
          </div>
        </div>

        {/* Graph */}
        <StatsGraph exerciseId={params.exerciseId} exerciseName={exercise.name} />

        {/* Recent Logs */}
        {logs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Recent Logs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold">Reps</th>
                    <th className="text-left py-3 px-4 font-semibold">Sets</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 20).map((log, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(log.loggedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold">{log.amount}</td>
                      <td className="py-3 px-4">{log.reps || "-"}</td>
                      <td className="py-3 px-4">{log.sets || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
