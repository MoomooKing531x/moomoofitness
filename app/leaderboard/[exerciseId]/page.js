"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../../components/Navbar";

export default function LeaderboardPage() {
  const params = useParams();
  const exerciseId = params.exerciseId;

  const [exercise, setExercise] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [timePeriod, setTimePeriod] = useState("alltime");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [timePeriod]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch user stats
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setUserStats(meData.user);
      }

      // Fetch leaderboard data
      const boardRes = await fetch(
        `/api/leaderboard/${exerciseId}?period=${timePeriod}&scope=everyone`
      );
      if (boardRes.ok) {
        const board = await boardRes.json();
        setExercise(board.exercise);
        setEntries(board.entries || []);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !exercise) {
    return (
      <div>
        <Navbar username={userStats?.username || ""} currentStreak={0} points={0} elo={1000} />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <p className="text-center text-gray-500">Loading leaderboard...</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar username={userStats?.username || ""} currentStreak={0} points={0} elo={1000} />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/leaderboard" className="text-sm text-gray-500 underline">
          ← Back to all leaderboards
        </Link>

        {/* Exercise Header */}
        <h1 className="text-3xl font-bold mt-6 mb-2">{exercise.name}</h1>
        <p className="text-sm text-gray-600 mb-6">
          Unit: <span className="font-semibold">{exercise.unit}</span>
        </p>

        {/* Time Period Filter */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Time Period</h3>
          <div className="flex gap-2 flex-wrap">
            {["daily", "weekly", "monthly", "yearly", "alltime"].map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition ${
                  timePeriod === period
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">
                    User
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">
                    {exercise.unit === "seconds" ? "Best Time" : "Best Set"}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">
                    Total
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">
                    Logs
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-6 text-center text-gray-500 text-sm">
                      No records yet for this period
                    </td>
                  </tr>
                ) : (
                  entries.slice(0, 100).map((entry, index) => (
                    <tr
                      key={entry.userId}
                      className={`border-b transition ${
                        entry.userId === userStats?.id
                          ? "bg-yellow-50"
                          : index % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50"
                      } hover:bg-blue-50`}
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {index === 0 && "🥇"}
                        {index === 1 && "🥈"}
                        {index === 2 && "🥉"}
                        {index > 2 && `#${index + 1}`}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/profile/${entry.username}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {entry.username}
                          {entry.userId === userStats?.id && " (you)"}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-blue-600">
                        {exercise.unit === "seconds"
                          ? `${entry.singleSetRecord}s`
                          : `${entry.singleSetRecord} ${exercise.unit}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {entry.total} total
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-500">
                        {entry.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">How it works</h4>
          <p className="text-sm text-blue-800">
            <strong>Best Set:</strong> Your highest single set performance (reps per set)
          </p>
          <p className="text-sm text-blue-800 mt-1">
            <strong>Total:</strong> Sum of all reps across all sets in this period
          </p>
        </div>
      </main>
    </div>
  );
}
