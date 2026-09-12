"use client";
import { useState, useEffect } from "react";
import CoinIcon from "./CoinIcon";

export default function BetModal({ friendId, friendName, onClose, userCoins }) {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [targetReps, setTargetReps] = useState("");
  const [daysUntilDeadline, setDaysUntilDeadline] = useState("3");
  const [coinsBet, setCoinsBet] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Fetch public exercises
    fetchExercises();
  }, []);

  async function fetchExercises() {
    try {
      const res = await fetch("/api/exercises");
      if (res.ok) {
        const data = await res.json();
        setExercises(data.exercises || []);
        if (data.exercises.length > 0) {
          setSelectedExercise(data.exercises[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
      setError("Could not load exercises");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBet() {
    setError("");
    setSuccess("");

    if (!selectedExercise || !targetReps || !daysUntilDeadline || !coinsBet) {
      setError("All fields are required");
      return;
    }

    if (parseInt(coinsBet) > userCoins) {
      setError(`You only have ${userCoins} coins`);
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/bets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accepterId: friendId,
          exerciseId: selectedExercise,
          targetReps: parseInt(targetReps),
          daysUntilDeadline: parseInt(daysUntilDeadline),
          coinsBet: parseInt(coinsBet),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(`Bet sent to ${friendName}! Waiting for acceptance...`);
        // Dispatch event to notify other components to refresh
        window.dispatchEvent(new CustomEvent("betsUpdated"));
        setTimeout(onClose, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to create bet");
      }
    } catch (error) {
      console.error("Error creating bet:", error);
      setError("Failed to send bet");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
          <p className="text-gray-600">Loading exercises...</p>
        </div>
      </div>
    );
  }

  const selectedExerciseObj = exercises.find((e) => e.id === selectedExercise);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Challenge {friendName}</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded mb-4 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {/* Exercise Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Exercise
            </label>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Reps */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Reps {selectedExerciseObj?.unit && `(${selectedExerciseObj.unit})`}
            </label>
            <input
              type="number"
              min="1"
              value={targetReps}
              onChange={(e) => setTargetReps(e.target.value)}
              placeholder="e.g., 100"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deadline (days)
            </label>
            <select
              value={daysUntilDeadline}
              onChange={(e) => setDaysUntilDeadline(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">1 week</option>
              <option value="14">2 weeks</option>
              <option value="30">1 month</option>
            </select>
          </div>

          {/* Coins Bet */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Coins to Bet
            </label>
            <div className="relative">
              <CoinIcon
                size={18}
                className="absolute left-3 top-3 text-yellow-600"
              />
              <input
                type="number"
                min="1"
                max={userCoins}
                value={coinsBet}
                onChange={(e) => setCoinsBet(e.target.value)}
                placeholder="e.g., 50"
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm"
              />
              <span className="absolute right-3 top-3 text-xs text-gray-500">
                You have: {userCoins}
              </span>
            </div>
          </div>

          {/* Summary */}
          {selectedExerciseObj && targetReps && daysUntilDeadline && coinsBet && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>{friendName}</strong> must complete{" "}
                <strong>{targetReps} {selectedExerciseObj.name}</strong> within{" "}
                <strong>{daysUntilDeadline} days</strong> to win{" "}
                <strong>
                  {parseInt(coinsBet) * 2}
                  <CoinIcon size={14} className="inline ml-1 text-yellow-600" />
                </strong>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={sending}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBet}
              disabled={sending || !selectedExercise || !targetReps || !coinsBet}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Bet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
