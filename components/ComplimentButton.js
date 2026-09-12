"use client";
import { useState } from "react";
import CoinIcon from "./CoinIcon";

const COMPLIMENT_OPTIONS = [
  "Keep going! 💪",
  "Nice work! 🌟",
  "You're crushing it! 🔥",
  "Amazing progress! 🎉",
  "Stay consistent! 📈",
  "Inspiring! ⭐",
];

export default function ComplimentButton({ friendId, friendName, userCoins }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSkipOption, setShowSkipOption] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState(null);

  const handleSend = async (skipCooldown = false) => {
    if (!selectedType) {
      setError("Please select a compliment or type a custom message");
      return;
    }

    if (selectedType === "custom" && (!customMessage || customMessage.trim().length === 0)) {
      setError("Please enter a custom message");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");
    setShowSkipOption(false);
    setCooldownInfo(null);
    try {
      const res = await fetch("/api/compliments/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: friendId,
          type: selectedType,
          customMessage: selectedType === "custom" ? customMessage : null,
          skipCooldown,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setSuccess("✅ Compliment sent!");
          setTimeout(() => {
            setIsOpen(false);
            setSelectedType(null);
            setCustomMessage("");
            setError("");
            setSuccess("");
          }, 1500);
        } else {
          setError(data.error);
        }
      } else {
        const error = await res.json();
        if (error.cooldownActive) {
          setCooldownInfo(error);
          setShowSkipOption(true);
          setError(error.error);
        } else {
          setError(error.error);
        }
      }
    } catch (error) {
      console.error("Error sending compliment:", error);
      setError("❌ Failed to send compliment");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setError("");
          setSuccess("");
          setShowSkipOption(false);
          setCooldownInfo(null);
        }}
        className="w-full py-2 px-4 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-semibold transition"
      >
        Send Compliment 💬
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Send a Compliment to {friendName}</h2>

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

              {showSkipOption && cooldownInfo && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded mb-4 text-sm">
                  <p className="font-semibold mb-2">Cooldown Active</p>
                  <p className="mb-2">Wait {cooldownInfo.timeRemainingMinutes} minutes or skip now:</p>
                  <button
                    onClick={() => handleSend(true)}
                    disabled={sending || userCoins < 100}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded font-semibold hover:bg-yellow-600 disabled:opacity-50 text-sm"
                  >
                    <CoinIcon size={14} className="text-yellow-200" />
                    Skip for 100 coins
                  </button>
                  {userCoins < 100 && (
                    <p className="text-xs text-red-600 mt-1">You need 100 coins (have {userCoins})</p>
                  )}
                </div>
              )}

              <div className="space-y-3 mb-4">
                {COMPLIMENT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedType(option);
                      setCustomMessage("");
                    }}
                    className={`w-full p-3 rounded-lg text-left transition ${
                      selectedType === option
                        ? "bg-pink-100 border-2 border-pink-500"
                        : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Custom Message (max 50 words)</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => {
                    setCustomMessage(e.target.value);
                    setSelectedType("custom");
                  }}
                  placeholder="Write something encouraging..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customMessage.trim().split(/\s+/).filter(word => word.length > 0).length}/50 words
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={sending}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSend(false)}
                  disabled={sending}
                  className="flex-1 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-semibold disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}