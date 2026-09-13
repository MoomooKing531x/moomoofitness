"use client";
import { useState } from "react";

export default function DeleteAccountButton() {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      title: "Delete Account",
      message: "Are you sure you want to DELETE your account?",
      buttonText: "Yes, I'm sure",
    },
    {
      title: "Enter Your Username",
      message: "Type your username to confirm.",
      buttonText: "Continue",
    },
    {
      title: "Enter Your Password",
      message: "Type your password to confirm.",
      buttonText: "Continue",
    },
    {
      title: "Confirm Your Password",
      message: "Type your password again to confirm.",
      buttonText: "Continue",
    },
    {
      title: "⚠️ WARNING",
      message: "This action is IRREVERSIBLE. Your account will be PERMANENTLY DELETED along with ALL data: exercise logs, streaks, coins, cosmetics, friends, bets, game progress, and your account itself.",
      buttonText: "I Understand",
      danger: true,
    },
    {
      title: "⚠️ FINAL CONFIRMATION",
      message: "Are you absolutely sure you want to DELETE your account? This cannot be undone and you will need to create a new account to use the app again.",
      buttonText: "YES, DELETE MY ACCOUNT",
      danger: true,
    },
  ];

  const handleNext = async () => {
    setError("");

    if (step === 1) {
      if (!username) {
        setError("Please enter your username");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!password) {
        setError("Please enter your password");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!confirmPassword) {
        setError("Please confirm your password");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      setLoading(true);
      try {
        const res = await fetch("/api/user/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.ok) {
          alert("Account deleted successfully. Redirecting to signup...");
          window.location.href = "/signup";
        } else {
          setError(data.error || "Deletion failed");
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
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  if (step === 0) {
    return (
      <button
        onClick={() => setStep(1)}
        className="mt-4 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-950 transition text-sm font-medium"
      >
        Delete Account
      </button>
    );
  }

  const currentStep = steps[step];

  return (
    <div className="mt-4 p-6 bg-red-100 border border-red-300 rounded-lg">
      <h3 className="text-xl font-bold text-red-900 mb-2">{currentStep.title}</h3>
      <p className="text-red-800 mb-4">{currentStep.message}</p>

      {step === 1 && (
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="w-full border border-red-300 rounded-md px-3 py-2 mb-4"
        />
      )}

      {step === 2 && (
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full border border-red-300 rounded-md px-3 py-2 mb-4"
        />
      )}

      {step === 3 && (
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
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
              ? "bg-red-900 text-white hover:bg-red-950"
              : "bg-red-800 text-white hover:bg-red-900"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Deleting..." : currentStep.buttonText}
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
