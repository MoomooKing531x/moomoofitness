"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingModal({ userId }) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Age, 2: Gender, 3: Name
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleComplete() {
    if (!age || !gender || !displayName) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: parseInt(age),
          gender,
          displayName,
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to complete onboarding");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        {/* Step 1: Age */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">How old are you?</h2>
            <input
              type="number"
              min="1"
              max="150"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className="w-full border rounded px-4 py-2 mb-6"
            />
            <button
              onClick={() => setStep(2)}
              disabled={!age}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Gender */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">What's your gender?</h2>
            <div className="space-y-3 mb-6">
              {["Male", "Female", "Prefer not to say"].map((option) => (
                <label key={option} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={option.toLowerCase()}
                    checked={gender === option.toLowerCase()}
                    onChange={(e) => setGender(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-lg">{option}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!gender}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Display Name */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">What should we call you?</h2>
            <p className="text-gray-600 text-sm mb-6">This is how we'll greet you when you visit!</p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
              placeholder="Enter your name"
              maxLength="30"
              className="w-full border rounded px-4 py-2 mb-6"
            />
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!displayName || loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Setting up..." : "You're all set! :)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
