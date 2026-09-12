"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ComparePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [period, setPeriod] = useState("alltime");
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchFriends();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFriends() {
    try {
      const res = await fetch("/api/friends/list");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  }

  async function searchUsers() {
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  }

  async function selectUser(user) {
    setTargetUser(user);
    setSearchQuery("");
    setSearchResults([]);
    fetchComparison(user.id);
  }

  async function fetchComparison(targetUserId) {
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?targetUserId=${targetUserId}&period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setComparisonData(data);
        if (data.comparisons.length > 0) {
          setSelectedExercise(data.comparisons[0].exercise.id);
        }
      }
    } catch (error) {
      console.error("Error fetching comparison:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (targetUser) {
      fetchComparison(targetUser.id);
    }
  }, [period]);

  if (loading && !currentUser) {
    return (
      <div>
        <Navbar
          username={currentUser?.username || ""}
          displayName={currentUser?.displayName || ""}
          currentStreak={0}
          elo={0}
          coins={0}
          id={currentUser?.id}
        />
        <main className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-center text-gray-500">Loading...</p>
        </main>
      </div>
    );
  }

  const currentExerciseData = comparisonData?.comparisons.find(c => c.exercise.id === selectedExercise);

  return (
    <div>
      <Navbar
        username={currentUser?.username || ""}
        displayName={currentUser?.displayName || ""}
        currentStreak={0}
        elo={currentUser?.elo || 0}
        coins={currentUser?.coins || 0}
        id={currentUser?.id}
      />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href="/leaderboard" className="text-sm text-gray-500 underline">
            ← Back to Leaderboard
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Compare Stats</h1>

        {!targetUser ? (
          /* User Selection */
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Select a Friend</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {friends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => selectUser(friend)}
                    className="bg-white border rounded-lg p-6 text-left hover:shadow-md transition"
                  >
                    <div className="font-semibold text-lg">{friend.displayName || friend.username}</div>
                    <div className="text-sm text-gray-600">@{friend.username}</div>
                  </button>
                ))}
                {friends.length === 0 && (
                  <p className="text-gray-500 col-span-full">No friends yet. Search for a user below.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Search for a User</h2>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type username..."
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchResults.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="bg-white border rounded-lg p-6 text-left hover:shadow-md transition"
                    >
                      <div className="font-semibold text-lg">{user.displayName || user.username}</div>
                      <div className="text-sm text-gray-600">@{user.username}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading comparison...</p>
          </div>
        ) : comparisonData ? (
          /* Comparison View */
          <div className="space-y-8">
            {/* User Info */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="font-bold text-lg text-green-600">{currentUser.username}</div>
                  <div className="text-3xl font-bold">{comparisonData.overallAnalysis.currentTotal}</div>
                  <div className="text-sm text-gray-500">Total units</div>
                </div>
                <div className="text-3xl font-bold text-gray-400">VS</div>
                <div className="text-center flex-1">
                  <div className="font-bold text-lg text-red-600">{targetUser.username}</div>
                  <div className="text-3xl font-bold">{comparisonData.overallAnalysis.targetTotal}</div>
                  <div className="text-sm text-gray-500">Total units</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setTargetUser(null);
                  setComparisonData(null);
                }}
                className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition"
              >
                Compare with different user
              </button>
            </div>

            {/* Period Selector */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Time Period</h3>
              <div className="flex gap-2 flex-wrap">
                {["today", "week", "month", "year", "alltime"].map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      period === p
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise Selector */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Select Exercise</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {comparisonData.comparisons.map(comp => (
                  <button
                    key={comp.exercise.id}
                    onClick={() => setSelectedExercise(comp.exercise.id)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                      selectedExercise === comp.exercise.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {comp.exercise.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            {currentExerciseData && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-4">{currentExerciseData.exercise.name}</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentExerciseData.currentUser.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="currentUser"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name={currentUser.username}
                        dot={{ r: 4 }}
                        animationDuration={1000}
                      />
                      <Line
                        type="monotone"
                        dataKey="targetUser"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name={targetUser.username}
                        dot={{ r: 4 }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Analysis */}
            {currentExerciseData && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Analysis</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="mr-3 text-xl">📊</span>
                    <span>
                      <strong>{currentUser.username}</strong> has <strong>{currentExerciseData.currentUser.total}</strong> {currentExerciseData.exercise.unit} vs{" "}
                      <strong>{targetUser.username}</strong>'s <strong>{currentExerciseData.targetUser.total}</strong> {currentExerciseData.exercise.unit}
                    </span>
                  </li>
                  {currentExerciseData.analysis.percentDifference !== 0 && (
                    <li className="flex items-start">
                      <span className="mr-3 text-xl">📈</span>
                      <span>
                        {currentExerciseData.analysis.winner === 'current' ? (
                          <><strong>{currentUser.username}</strong> is ahead by <strong>{Math.abs(currentExerciseData.analysis.percentDifference)}%</strong></>
                        ) : (
                          <><strong>{targetUser.username}</strong> is ahead by <strong>{Math.abs(currentExerciseData.analysis.percentDifference)}%</strong></>
                        )}
                      </span>
                    </li>
                  )}
                  {currentExerciseData.analysis.currentWeekChange !== 0 && (
                    <li className="flex items-start">
                      <span className="mr-3 text-xl">🔥</span>
                      <span>
                        <strong>{currentUser.username}</strong> had a <strong>{currentExerciseData.analysis.currentWeekChange > 0 ? '+' : ''}{currentExerciseData.analysis.currentWeekChange}%</strong> change in the past week
                      </span>
                    </li>
                  )}
                  {currentExerciseData.analysis.targetWeekChange !== 0 && (
                    <li className="flex items-start">
                      <span className="mr-3 text-xl">🔥</span>
                      <span>
                        <strong>{targetUser.username}</strong> had a <strong>{currentExerciseData.analysis.targetWeekChange > 0 ? '+' : ''}{currentExerciseData.analysis.targetWeekChange}%</strong> change in the past week
                      </span>
                    </li>
                  )}
                  {comparisonData.overallAnalysis.exercisesWon > 0 && (
                    <li className="flex items-start">
                      <span className="mr-3 text-xl">🏆</span>
                      <span>
                        <strong>{currentUser.username}</strong> leads in <strong>{comparisonData.overallAnalysis.exercisesWon}</strong> exercise{comparisonData.overallAnalysis.exercisesWon !== 1 ? 's' : ''}
                      </span>
                    </li>
                  )}
                  {comparisonData.overallAnalysis.exercisesLost > 0 && (
                    <li className="flex items-start">
                      <span className="mr-3 text-xl">⚡</span>
                      <span>
                        <strong>{targetUser.username}</strong> leads in <strong>{comparisonData.overallAnalysis.exercisesLost}</strong> exercise{comparisonData.overallAnalysis.exercisesLost !== 1 ? 's' : ''}
                      </span>
                    </li>
                  )}
                  {currentExerciseData.currentUser.total > 0 && currentExerciseData.targetUser.total > 0 && (
                    <li className="flex items-start">
                      <span className="mr-3 text-xl">⚖️</span>
                      <span>
                        Both users have logged this exercise - great competition!
                      </span>
                    </li>
                  )}
                  {currentExerciseData.currentUser.total === 0 && currentExerciseData.targetUser.total > 0 && (
                    <li className="flex items-start">
                      <span className="mr-3 text-xl">💪</span>
                      <span>
                        <strong>{currentUser.username}</strong> hasn't logged this exercise yet - time to catch up!
                      </span>
                    </li>
                  )}
                  {currentExerciseData.currentUser.total > 0 && currentExerciseData.targetUser.total === 0 && (
                    <li className="flex items-start">
                      <span className="mr-3 text-xl">🎯</span>
                      <span>
                        <strong>{currentUser.username}</strong> is the only one logging this exercise - keep it up!
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
