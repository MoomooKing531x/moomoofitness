"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RecentExercises({ exercises }) {
  const router = useRouter();
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  // Load dismissed patterns from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dismissedRecentExercises");
    if (saved) {
      try {
        setDismissed(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Error loading dismissed patterns:", e);
      }
    }
  }, []);

  // Save dismissed patterns to localStorage
  useEffect(() => {
    localStorage.setItem("dismissedRecentExercises", JSON.stringify(Array.from(dismissed)));
  }, [dismissed]);

  // Fetch recent patterns
  useEffect(() => {
    async function fetchPatterns() {
      try {
        const res = await fetch("/api/recent-exercises");
        if (res.ok) {
          const data = await res.json();
          setPatterns(data.patterns || []);
        }
      } catch (error) {
        console.error("Error fetching recent exercises:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPatterns();
  }, []);

  // Handle quick log
  async function handleQuickLog(pattern) {
    const exercise = exercises.find((e) => e.name === pattern.exerciseName);

    if (!exercise) {
      alert("Exercise not found");
      return;
    }

    const body = {
      exerciseId: exercise.id,
      amount: pattern.amount,
      reps: pattern.unit === "seconds" ? null : pattern.amount,
      sets: pattern.unit === "seconds" ? null : 1,
    };

    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Logged ${pattern.amount} ${pattern.unit} of ${pattern.exerciseName}! Streak: ${data.currentStreak} days 🔥`);
        // Dispatch event to notify bet components to refresh
        window.dispatchEvent(new CustomEvent("betsUpdated"));
        router.refresh();
      } else {
        alert("Failed to log exercise");
      }
    } catch (error) {
      console.error("Error logging exercise:", error);
      alert("Network error");
    }
  }

  // Handle dismiss
  function handleDismiss(patternKey) {
    setDismissed((prev) => new Set([...prev, patternKey]));
  }

  // Filter out dismissed patterns
  const visiblePatterns = patterns.filter((p) => {
    const key = `${p.exerciseId}-${p.amount}-${p.unit}`;
    return !dismissed.has(key);
  });

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Recent Exercises</h3>
        <p className="text-xs text-gray-400">Loading...</p>
      </div>
    );
  }

  if (visiblePatterns.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Recent Exercises</h3>
        <p className="text-xs text-gray-400">
          Log exercises consistently to see quick-log presets here!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-500 mb-3">Recent Exercises</h3>
      <div className="space-y-2">
        {visiblePatterns.map((pattern) => {
          const key = `${pattern.exerciseId}-${pattern.amount}-${pattern.unit}`;
          return (
            <div
              key={key}
              className="flex items-center justify-between bg-white rounded-md border border-gray-200 p-2 hover:border-gray-300 transition"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{pattern.exerciseName}</div>
                <div className="text-xs text-gray-500">
                  {pattern.amount} {pattern.unit} • Logged {pattern.count} times
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickLog(pattern)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition"
                >
                  Log
                </button>
                <button
                  onClick={() => handleDismiss(key)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
