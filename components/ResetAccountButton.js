"use client";
import { useState } from "react";

export default function ResetAccountButton() {
  const [step, setStep] = useState(0);
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      title: "Reset All Stats",
      message: "Are you sure you want to reset all your stats?",
      buttonText: "Yes, I'm sure",
    },
    {
      title: "Enter Your Username",
      message: "Type your username as your password to confirm.",
      buttonText: "Continue",
    },
    {
      title: "Confirm Username",
      message: "Type your username again to confirm.",
      buttonText: "Continue",
    },
    {
      title: "⚠️ FINAL WARNING",
      message: "This will permanently delete: ALL exercise logs, streaks, coins, cosmetics, friends, bets, and game progress. This action CANNOT be undone.",
      buttonText: "I AM SURE - RESET MY ACCOUNT",
      danger: true,
    },
  ];

  const handleNext = async () => {
    setError("");

    if (step === 1) {
      if (!password1) {
        setError("Please enter your username");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!password2) {
        setError("Please enter your username again");
        return;
      }
      if (password1 !== password2) {
        setError("Usernames do not match");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setLoading(true);
      try {
        const res = await fetch("/api/user/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password1, password2 }),
        });

        const data = await res.json();

        if (res.ok) {
          alert("Account reset successfully. Redirecting to login...");
          window.location.href = "/login";
        } else {
          setError(data.error || "Reset failed");
          setLoading(false);
        }
      } catch (err) {
        setError("Network error. Please try again.");
        setLoading(false);
      }
    } else {
      setStep(1);
    }
  };

  const handleCancel = () => {
    setStep(0);
    setPassword1("");
    setPassword2("");
    setError("");
  };

  if (step === 0) {
    return (
      <button
        onClick={() => setStep(1)}
        className="mt-12 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-medium"
      >
        Reset All Stats
      </button>
    );
  }

  const currentStep = steps[step];

  return (
    <div className="mt-12 p-6 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-xl font-bold text-red-900 mb-2">{currentStep.title}</h3>
      <p className="text-red-800 mb-4">{currentStep.message}</p>

      {step === 1 && (
        <input
          type="text"
          value={password1}
          onChange={(e) => setPassword1(e.target.value)}
          placeholder="Enter your username"
          className="w-full border border-red-300 rounded-md px-3 py-2 mb-4"
        />
      )}

      {step === 2 && (
        <input
          type="text"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          placeholder="Enter your username again"
          className="w-full border border-red-300 rounded-md px-3 py-2 mb-4"
        />
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleNext}
          disabled={loading}
          className={`px-4 py-2 rounded-md font-medium transition ${
            currentStep.danger
              ? "bg-red-700 text-white hover:bg-red-800"
              : "bg-red-600 text-white hover:bg-red-700"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Resetting..." : currentStep.buttonText}
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
