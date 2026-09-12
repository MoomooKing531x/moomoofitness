"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORY_LABELS = {
  upper: "Upper Body",
  lower: "Lower Body",
  core: "Core & Isometric Holds",
  custom: "Custom (Community)",
};

const OTHERS = "__OTHERS__";

const ENCOURAGEMENT_MESSAGES = [
  "Keep going!",
  "Nice!",
  "Great work!",
  "You're crushing it!",
  "Awesome!",
  "Keep it up!",
  "💪 Strong!",
  "Excellent!",
  "Way to go!",
  "You got this!",
  "Impressive!",
  "Phenomenal!",
  "That's the spirit!",
  "Nailed it!",
  "Keep pushing!",
  "Unstoppable!",
  "Pure power!",
  "Legendary!",
];

export default function LogForm({ exercises }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(exercises[0]?.id || "");
  const [customName, setCustomName] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("1");
  const [message, setMessage] = useState("");
  const [floatingAnimations, setFloatingAnimations] = useState([]);
  const [encouragementMsg, setEncouragementMsg] = useState("");
  const [showEncouragement, setShowEncouragement] = useState(false);

  const grouped = exercises.reduce((acc, ex) => {
    acc[ex.category] = acc[ex.category] || [];
    acc[ex.category].push(ex);
    return acc;
  }, {});

  const selected = exercises.find((e) => e.id === selectedId);
  const isOthers = selectedId === OTHERS;
  const isTimeBasedExercise = selected?.unit === "seconds";
  const isRunning = selected?.name?.toLowerCase() === "running";

  // Calculate total amount: reps x sets (or just reps if sets is empty)
  const calculateTotal = () => {
    const repsNum = parseInt(reps) || 0;
    const setsNum = parseInt(sets) || 0;
    if (repsNum === 0) return 0;
    // For both time-based and reps-based: multiply by sets (default to 1 if sets is 0)
    const actualSets = setsNum || 1;
    return repsNum * actualSets;
  };

  const total = calculateTotal();

  async function handleInsert(e) {
    e.preventDefault();
    setMessage("");

    if (!reps || parseInt(reps) <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }

    const body = isOthers
      ? {
          customName,
          amount: total,
          reps: isTimeBasedExercise ? null : parseInt(reps),
          sets: isTimeBasedExercise ? null : (parseInt(sets) || 1),
        }
      : {
          exerciseId: selectedId,
          amount: total,
          reps: isTimeBasedExercise ? null : parseInt(reps),
          sets: isTimeBasedExercise ? null : (parseInt(sets) || 1),
        };

    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // Try to parse error response
        let errorMsg = "Something went wrong.";
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${res.status}`;
        }
        setMessage(errorMsg);
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        setMessage("Invalid server response. Please try again.");
        return;
      }

      // Show random encouragement message
      const randomEncouragement = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
      setEncouragementMsg(randomEncouragement);
      setShowEncouragement(true);
      setTimeout(() => setShowEncouragement(false), 2500);

      // Create floating animations for points and ELO
      const newAnimations = [];

      if (data.pointsEarned) {
        newAnimations.push({
          id: `points-${Date.now()}`,
          type: "points",
          amount: data.pointsEarned,
        });
      }

      if (data.eloEarned) {
        newAnimations.push({
          id: `elo-${Date.now()}`,
          type: "elo",
          amount: data.eloEarned,
        });
      }

      if (newAnimations.length > 0) {
        setFloatingAnimations((prev) => [...prev, ...newAnimations]);
        setTimeout(() => {
          setFloatingAnimations((prev) =>
            prev.filter((anim) => !newAnimations.find((na) => na.id === anim.id))
          );
        }, 2000);
      }

      setMessage(`Logged! Streak: ${data.currentStreak} day${data.currentStreak === 1 ? "" : "s"} 🔥`);
      // Dispatch event to notify bet components to refresh
      window.dispatchEvent(new CustomEvent("betsUpdated"));
      setReps("");
      setSets("1");
      if (isOthers) setCustomName("");
      router.refresh();
    } catch (error) {
      console.error("Error logging exercise:", error);
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="relative">
      {Object.entries(grouped).map(([category, list]) => (
        <div key={category} className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">
            {CATEGORY_LABELS[category] || category}
          </h2>
          <div className="flex flex-wrap gap-2">
            {list.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedId(ex.id)}
                className={`px-3 py-2 rounded-md border text-sm ${
                  selectedId === ex.id
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 hover:border-gray-500"
                }`}
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-2">Others</h2>
        <button
          onClick={() => setSelectedId(OTHERS)}
          className={`px-3 py-2 rounded-md border text-sm ${
            isOthers ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:border-gray-500"
          }`}
        >
          + Custom exercise
        </button>
        <p className="text-xs text-gray-400 mt-1">
          Won't appear on any leaderboard until 2+ people log the exact same name.
        </p>
      </div>

      <form onSubmit={handleInsert} className="flex items-end gap-3 mt-6 border-t pt-6 flex-wrap">
        {isOthers && (
          <div className="flex flex-col">
            <label className="text-sm text-gray-500 mb-1">Exercise name</label>
            <input
              className="border border-gray-300 rounded-md px-3 py-2 w-48"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Ring Dips"
            />
          </div>
        )}

        {/* Reps/Seconds/KM input */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">
            {isRunning ? "KM" : isTimeBasedExercise ? "Seconds" : "Reps"}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            className="border border-gray-300 rounded-md px-3 py-2 w-24"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder={isRunning ? "KM" : isTimeBasedExercise ? "Seconds" : "Reps"}
          />
        </div>

        {/* Sets (for both time-based and reps-based, NOT for running) */}
        {!isRunning && (
          <div className="flex flex-col">
            <label className="text-sm text-gray-500 mb-1">Sets</label>
            <input
              type="number"
              min="0"
              className="border border-gray-300 rounded-md px-3 py-2 w-24"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              placeholder="Sets (default 1)"
            />
          </div>
        )}

        {/* Total Display */}
        {total > 0 && (
          <div className="flex flex-col px-3 py-2 bg-blue-50 rounded-md border border-blue-200">
            <span className="text-xs text-gray-600">Total</span>
            <span className="font-semibold text-lg">{total}</span>
          </div>
        )}

        <button
          type="submit"
          className="border border-gray-900 rounded-md px-4 py-2 font-medium hover:bg-gray-900 hover:text-white transition"
        >
          Insert
        </button>
      </form>
      {message && <p className="text-sm mt-3 text-gray-700">{message}</p>}

      {/* Encouragement Animation */}
      {showEncouragement && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="animate-bounce text-6xl font-bold text-green-500 drop-shadow-lg">
            {encouragementMsg}
          </div>
        </div>
      )}

      {/* Floating Animations */}
      <div className="fixed inset-0 pointer-events-none">
        {floatingAnimations.map((anim) => (
          <div
            key={anim.id}
            className={`fixed ${
              anim.type === "points" ? "left-1/3" : "right-1/3"
            } top-1/2 animate-bounce text-2xl font-bold drop-shadow-lg`}
            style={{
              animation: `float-up 2s ease-out forwards`,
              color: anim.type === "points" ? "#FFD700" : "#4F46E5",
            }}
          >
            +{anim.amount}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px);
          }
        }
      `}</style>
    </div>
  );
}
