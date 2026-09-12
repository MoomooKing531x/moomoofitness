"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function LeaderboardPage() {
  const [boardType, setBoardType] = useState("exercises"); // exercises, streaks, totals
  const [streakType, setStreakType] = useState("daily"); // daily or workout
  const [totalType, setTotalType] = useState("challenges"); // challenges or workouts
  const [scope, setScope] = useState("everyone");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState({});
  const [streakLeaderboard, setStreakLeaderboard] = useState([]);
  const [totalLeaderboard, setTotalLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (boardType === "exercises" && exercises.length > 0) {
      fetchLeaderboardData();
    } else if (boardType === "streaks") {
      fetchStreakLeaderboard();
    } else if (boardType === "totals") {
      fetchTotalLeaderboard();
    }
  }, [boardType, scope, exercises, streakType, totalType]);

  async function fetchExercises() {
    try {
      const exercisesRes = await fetch("/api/exercises");
      if (exercisesRes.ok) {
        const data = await exercisesRes.json();
        const exList = data.exercises || [];
        setExercises(exList);
        if (exList.length > 0) {
          setSelectedExercise(exList[0].id);
        }
      }

      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setUserStats(meData.user);

        const logsRes = await fetch("/api/logs/list");
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setUserLogs(logsData.logs || []);
        }
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
    }
  }

  async function fetchLeaderboardData() {
    setLoading(true);
    try {
      const boardData = {};
      for (const exercise of exercises) {
        const boardRes = await fetch(
          `/api/leaderboard/${exercise.id}?scope=${scope}`
        );
        if (boardRes.ok) {
          const board = await boardRes.json();
          boardData[exercise.id] = board.entries || [];
        }
      }
      setLeaderboardData(boardData);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStreakLeaderboard() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard/streaks?type=${streakType}&scope=${scope}`);
      if (res.ok) {
        const data = await res.json();
        setStreakLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching streak leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTotalLeaderboard() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard/totals?type=${totalType}&scope=${scope}`);
      if (res.ok) {
        const data = await res.json();
        setTotalLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching total leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const getUserFrequency = (exerciseId) => {
    return userLogs.filter((log) => log.exerciseId === exerciseId).length;
  };

  const sortedExercises = [...exercises].sort((a, b) => {
    return getUserFrequency(b.id) - getUserFrequency(a.id);
  });

  const currentExercise = exercises.find((e) => e.id === selectedExercise);
  const currentEntries = leaderboardData[selectedExercise] || [];
  const userRank = currentEntries.findIndex((e) => e.userId === userStats?.id) + 1;

  if (loading && exercises.length === 0) {
    return (
      <div>
        <Navbar
          username={userStats?.username || ""}
          currentStreak={0}
          points={0}
          elo={0}
        />
        <main className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-center text-gray-500">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar
        username={userStats?.username || ""}
        displayName={userStats?.displayName || ""}
        currentStreak={0}
        elo={userStats?.elo || 0}
        coins={userStats?.coins || 0}
      />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-8">Leaderboards</h1>

        {/* Board Type Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-300">
          <button
            onClick={() => setBoardType("exercises")}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${
              boardType === "exercises"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Exercise Leaderboards
          </button>
          <button
            onClick={() => setBoardType("streaks")}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${
              boardType === "streaks"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Streak Leaderboards
          </button>
          <button
            onClick={() => setBoardType("totals")}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${
              boardType === "totals"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Total Leaderboards
          </button>
        </div>

        {/* Exercise Leaderboards Section */}
        {boardType === "exercises" && (
          <>
            <div className="bg-white border rounded-lg p-6 mb-8 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Scope</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setScope("everyone")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      scope === "everyone"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Everyone
                  </button>
                  <button
                    onClick={() => setScope("friends")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      scope === "friends"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Friends
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Exercises</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {sortedExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => setSelectedExercise(ex.id)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                        selectedExercise === ex.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Exercise Leaderboard Table */}
            {currentExercise && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">{currentExercise.name}</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 w-16">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">User</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentEntries.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                            No records yet
                          </td>
                        </tr>
                      ) : (
                        currentEntries.map((entry, index) => (
                          <tr
                            key={entry.userId}
                            className={`border-b transition ${
                              entry.userId === userStats?.id ? "bg-yellow-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-blue-50`}
                          >
                            <td className="px-6 py-4 text-sm font-bold text-gray-900 w-16">
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
                                {entry.username} {entry.userId === userStats?.id && "(YOU)"}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-right text-gray-600 font-semibold">
                              {entry.total} {currentExercise.unit}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Streak Leaderboards Section */}
        {boardType === "streaks" && (
          <>
            <div className="bg-white border rounded-lg p-6 mb-8 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Scope</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setScope("everyone")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      scope === "everyone"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Everyone
                  </button>
                  <button
                    onClick={() => setScope("friends")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      scope === "friends"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Friends
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Streak Type</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => setStreakType("daily")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      streakType === "daily"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Daily Challenge Streak
                  </button>
                  <button
                    onClick={() => setStreakType("workout")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      streakType === "workout"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Workout Streak
                  </button>
                </div>
              </div>
            </div>

            {/* Streak Leaderboard Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {streakType === "daily" ? "Daily Challenge Streaks" : "Workout Streaks"}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 w-16">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">User</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Current Streak</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streakLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          No streaks yet
                        </td>
                      </tr>
                    ) : (
                      streakLeaderboard.map((entry, index) => (
                        <tr
                          key={entry.id}
                          className={`border-b transition ${
                            entry.id === userStats?.id ? "bg-yellow-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50`}
                        >
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 w-16">
                            {index === 0 && "🔥"}
                            {index === 1 && "🏅"}
                            {index === 2 && "🎖️"}
                            {index > 2 && `#${index + 1}`}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Link
                              href={`/profile/${entry.username}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {entry.username} {entry.id === userStats?.id && "(YOU)"}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            {streakType === "daily" ? entry.dailyChallengeStreak : entry.currentStreak}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-600">
                            {streakType === "daily" ? entry.totalDailyChallengesDone : entry.totalWorkoutDaysDone}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Total Leaderboards Section */}
        {boardType === "totals" && (
          <>
            <div className="bg-white border rounded-lg p-6 mb-8 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Scope</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setScope("everyone")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      scope === "everyone"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Everyone
                  </button>
                  <button
                    onClick={() => setScope("friends")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      scope === "friends"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Friends
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Total Type</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => setTotalType("challenges")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      totalType === "challenges"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Daily Challenges Completed
                  </button>
                  <button
                    onClick={() => setTotalType("workouts")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      totalType === "workouts"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Workout Days
                  </button>
                </div>
              </div>
            </div>

            {/* Total Leaderboard Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-teal-50 px-6 py-4 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {totalType === "challenges" ? "Total Daily Challenges" : "Total Workout Days"}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 w-16">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">User</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totalLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                          No data yet
                        </td>
                      </tr>
                    ) : (
                      totalLeaderboard.map((entry, index) => (
                        <tr
                          key={entry.id}
                          className={`border-b transition ${
                            entry.id === userStats?.id ? "bg-yellow-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50`}
                        >
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 w-16">
                            {index === 0 && "🏆"}
                            {index === 1 && "🥈"}
                            {index === 2 && "🥉"}
                            {index > 2 && `#${index + 1}`}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Link
                              href={`/profile/${entry.username}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {entry.username} {entry.id === userStats?.id && "(YOU)"}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            {totalType === "challenges" ? entry.totalDailyChallengesDone : entry.totalWorkoutDaysDone}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
