"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import CoinIcon from "./CoinIcon";

export default function BetsPanel() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [acceptingBet, setAcceptingBet] = useState(null);
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    fetchBets();
    // Poll every 2 seconds for real-time updates
    const interval = setInterval(fetchBets, 2000);

    // Listen for custom bet update events
    const handleBetsUpdated = () => {
      fetchBets();
    };
    window.addEventListener("betsUpdated", handleBetsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener("betsUpdated", handleBetsUpdated);
    };
  }, []);

  async function fetchBets() {
    try {
      const res = await fetch("/api/bets/list");
      if (res.ok) {
        const data = await res.json();
        // Show pending, accepted, and recently completed bets
        const activeBets = (data.bets || []).filter(bet =>
          bet.status === "pending" || bet.status === "accepted" ||
          bet.status === "creator_won" || bet.status === "accepter_won"
        );
        setBets(activeBets);
        setUserCoins(data.userCoins || 0);
      }
    } catch (error) {
      console.error("Error fetching bets:", error);
      setError("Could not load bets");
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptBet(betId) {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return;

    // Check if user has enough coins before calling API
    if (userCoins < bet.coinsBet) {
      setError(`❌ Not enough coins to accept bet. Need ${bet.coinsBet}, you have ${userCoins}`);
      return;
    }

    setAcceptingBet(betId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/bets/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId }),
      });

      if (res.ok) {
        setSuccess("✅ Bet accepted! The challenge begins!");
        // Dispatch event to notify other components to refresh
        window.dispatchEvent(new CustomEvent("betsUpdated"));
        fetchBets();
      } else {
        const data = await res.json();
        setError(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Error accepting bet:", error);
      setError("❌ Failed to accept bet");
    } finally {
      setAcceptingBet(null);
    }
  }

  async function handleDismissBet(betId) {
    try {
      const res = await fetch("/api/bets/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId }),
      });

      if (res.ok) {
        // Refresh bets to remove the dismissed one
        fetchBets();
      } else {
        const error = await res.json();
        setError(`❌ ${error.error}`);
      }
    } catch (error) {
      console.error("Error dismissing bet:", error);
      setError("❌ Failed to dismiss bet");
    }
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">Loading bets...</p>
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No active bets yet</p>
        <p className="text-xs text-gray-400 mt-1">Visit a friend's profile to create one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
          {success}
        </div>
      )}

      {bets.map((bet) => {
        const isPending = bet.status === "pending";
        const isAccepted = bet.status === "accepted";
        const isCompleted = bet.status === "creator_won" || bet.status === "accepter_won";

        return (
          <div
            key={bet.id}
            className={`border rounded-lg p-4 ${
              isPending
                ? "bg-yellow-50 border-yellow-300"
                : isAccepted
                ? "bg-blue-50 border-blue-300"
                : "bg-green-100 border-green-500"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {bet.isCreator ? "You challenged " : ""}
                  <Link
                    href={`/profile/${bet.opponent.username}`}
                    className="text-blue-600 hover:underline"
                  >
                    {bet.opponent.displayName || bet.opponent.username}
                  </Link>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {bet.exercise.name} • {bet.targetReps} {bet.exercise.unit} • {bet.timeRemaining} days left
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold flex items-center gap-1 justify-end">
                  <CoinIcon size={16} className="text-yellow-600" />
                  {bet.coinsBet}
                </p>
                <p className={`text-xs ${isPending ? "text-yellow-600" : isAccepted ? "text-blue-600" : "text-green-600"}`}>
                  {isPending ? "Pending..." : isAccepted ? "Ongoing" : "Completed"}
                </p>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2 mb-3">
              {/* Your Progress */}
              <div>
                <p className="text-xs text-gray-600 mb-1">
                  Your Progress: {bet.myProgress}/{bet.targetReps} {bet.exercise.unit}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all"
                    style={{ width: `${Math.min(bet.progressPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Opponent Progress */}
              {isAccepted && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    {bet.opponent.displayName || bet.opponent.username}'s Progress: {bet.opponentProgress}/{bet.targetReps} {bet.exercise.unit}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full transition-all"
                      style={{ width: `${Math.min((bet.opponentProgress / bet.targetReps) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {isPending && bet.accepter === null && !bet.isCreator && (
              <button
                onClick={() => handleAcceptBet(bet.id)}
                disabled={acceptingBet === bet.id}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {acceptingBet === bet.id ? "Accepting..." : "Accept Bet"}
              </button>
            )}

            {isPending && bet.isCreator && (
              <p className="text-xs text-yellow-700 text-center">
                Waiting for {bet.accepter?.displayName || bet.accepter?.username || "opponent"} to accept...
              </p>
            )}

            {isAccepted && (
              <p className="text-xs text-blue-700 text-center font-semibold">
                Challenge in progress! Log exercises toward this bet.
              </p>
            )}

            {isCompleted && (
              <div className="text-center">
                <p className="text-sm text-green-800 font-bold mb-2">
                  ✅ Completed!
                </p>
                <button
                  onClick={() => handleDismissBet(bet.id)}
                  className="text-xs text-green-600 hover:text-green-800 underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
