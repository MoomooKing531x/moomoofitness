"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function GameLeaderboardContent() {
  const [leaderboard, setLeaderboard] = useState(null);
  const [scope, setScope] = useState("everyone");
  const [gender, setGender] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Get current user ID
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUserId(data.user.id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [scope, gender]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/game/leaderboard?scope=${scope}&gender=${gender}`);
      const data = await res.json();
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchLeaderboard();
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/game/leaderboard?scope=${scope}&gender=${gender}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to search leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">Loading...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Rep Defense Coins Leaderboard</h1>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setScope("everyone")}
          className={`px-4 py-2 rounded ${
            scope === "everyone" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Everyone
        </button>
        <button
          onClick={() => setScope("friends")}
          className={`px-4 py-2 rounded ${
            scope === "friends" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setGender("all")}
          className={`px-4 py-2 rounded ${
            gender === "all" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setGender("male")}
          className={`px-4 py-2 rounded ${
            gender === "male" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Male
        </button>
        <button
          onClick={() => setGender("female")}
          className={`px-4 py-2 rounded ${
            gender === "female" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Female
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username..."
          className="border rounded px-3 py-2 flex-1"
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      {leaderboard && (
        <div className="border border-gray-200 rounded-md divide-y">
          {leaderboard.top10.length === 0 && (
            <p className="p-4 text-sm text-gray-500">No one has earned coins from Rep Defense yet. Be the first!</p>
          )}
          {leaderboard.top10.map((row) => (
            <div key={row.userId} className={`flex justify-between px-4 py-3 text-sm ${row.userId === currentUserId ? "bg-gray-50 font-medium" : ""}`}>
              <span>
                #{row.rank}{" "}
                <Link href={`/profile/${row.username}`} className="hover:underline">
                  {row.username}
                </Link>
              </span>
              <span>
                {row.totalCoins} Coins
              </span>
            </div>
          ))}

          {leaderboard.you && leaderboard.you.rank > 10 && (
            <div className="flex justify-between px-4 py-3 text-sm bg-gray-50 font-medium">
              <span>
                YOU #{leaderboard.you.rank}{" "}
                <Link href={`/profile/${leaderboard.you.username}`} className="hover:underline">
                  {leaderboard.you.username}
                </Link>
              </span>
              <span>
                {leaderboard.you.totalCoins} Coins
              </span>
            </div>
          )}

          {search &&
            leaderboard.searched &&
            leaderboard.searched.rank > 10 &&
            (!leaderboard.you || leaderboard.you.userId !== leaderboard.searched.userId) && (
              <div className="flex justify-between px-4 py-3 text-sm bg-gray-50 font-medium">
                <span>
                  #{leaderboard.searched.rank}{" "}
                  <Link href={`/profile/${leaderboard.searched.username}`} className="hover:underline">
                    {leaderboard.searched.username}
                  </Link>
                </span>
                <span>
                  {leaderboard.searched.totalCoins} Coins
                </span>
              </div>
            )}

          {search && !leaderboard.searched && (
            <p className="p-3 text-xs text-gray-400">
              No result for "{search}" in this view.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
