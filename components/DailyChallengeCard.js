"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DailyChallengeCard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showDifficultyQuiz, setShowDifficultyQuiz] = useState(false);

  useEffect(() => {
    fetch("/api/challenge")
      .then((r) => r.json())
      .then(setData);
  }, []);

  async function complete() {
    if (!data?.challenge) return;
    setBusy(true);
    const res = await fetch("/api/challenge/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: data.challenge.id }),
    });
    if (res.ok) {
      setData({ ...data, completed: true });
      setShowDifficultyQuiz(true);
      router.refresh();
    }
    setBusy(false);
  }

  async function shuffleChallenge() {
    if (!data?.challenge) return;
    setBusy(true);
    const res = await fetch("/api/challenge/shuffle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: data.challenge.id }),
    });
    if (res.ok) {
      const result = await res.json();
      setData({
        challenge: result.challenge,
        completed: false,
        userDifficulty: null,
      });
      router.refresh();
    }
    setBusy(false);
  }

  async function submitDifficulty(difficulty) {
    const res = await fetch("/api/challenge/difficulty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        challengeId: data.challenge.id,
        difficulty 
      }),
    });
    if (res.ok) {
      setShowDifficultyQuiz(false);
      setData({ ...data, userDifficulty: difficulty });
    }
  }

  if (!data || !data.challenge) return null;

  const { exerciseName, targetAmount, unit, isTrySomethingNew } = data.challenge;

  return (
    <div className="border border-gray-200 rounded-md p-4 mb-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-500">Daily Challenge</p>
            {isTrySomethingNew && (
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                Try something new
              </span>
            )}
          </div>
          <p className="text-sm font-medium">
            {targetAmount} {unit} of {exerciseName}
          </p>
          <p className="text-xs text-gray-400 mt-1">Be honest on your tracking!</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => shuffleChallenge()}
            disabled={data.completed || busy}
            title="Shuffle to a different challenge"
            className={`px-3 py-2 rounded-md border text-sm font-medium ${
              data.completed || busy
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-orange-300 text-orange-700 hover:bg-orange-50"
            }`}
          >
            Too hard!
          </button>
          <button
            onClick={complete}
            disabled={data.completed || busy}
            className={`px-3 py-2 rounded-md border text-sm font-medium ${
              data.completed
                ? "border-gray-200 text-gray-400"
                : "border-gray-900 hover:bg-gray-900 hover:text-white"
            }`}
          >
            {data.completed ? "Completed ✓" : busy ? "..." : "Mark Completed"}
          </button>
        </div>
      </div>

      {/* Difficulty Quiz */}
      {showDifficultyQuiz && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium mb-2">How difficult was this challenge?</p>
          <div className="flex gap-2">
            <button
              onClick={() => submitDifficulty("easy")}
              className="flex items-center gap-2 px-3 py-1 rounded border text-sm hover:bg-green-50 hover:border-green-300"
            >
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              Easy
            </button>
            <button
              onClick={() => submitDifficulty("medium")}
              className="flex items-center gap-2 px-3 py-1 rounded border text-sm hover:bg-yellow-50 hover:border-yellow-300"
            >
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              Medium
            </button>
            <button
              onClick={() => submitDifficulty("hard")}
              className="flex items-center gap-2 px-3 py-1 rounded border text-sm hover:bg-red-50 hover:border-red-300"
            >
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              Hard
            </button>
            <button
              onClick={() => setShowDifficultyQuiz(false)}
              className="px-3 py-1 rounded border text-sm text-gray-500 hover:bg-gray-50"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Show submitted difficulty */}
      {data.userDifficulty && !showDifficultyQuiz && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
          You rated this: 
          <div className={`w-3 h-3 rounded-full ${
            data.userDifficulty === 'easy' ? 'bg-green-500' : 
            data.userDifficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          {data.userDifficulty}
        </div>
      )}
    </div>
  );
}
