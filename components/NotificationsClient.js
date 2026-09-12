"use client";
import { useState } from "react";

export default function NotificationsClient({ initialNotifications, initialGifts }) {
  const [gifts, setGifts] = useState(initialGifts);
  const [claiming, setClaiming] = useState(null);
  const [processingBet, setProcessingBet] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleClaimGift(giftId) {
    setClaiming(giftId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/shop/claim-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId }),
      });

      if (res.ok) {
        // Mark as claimed
        setGifts(gifts.map(g => g.id === giftId ? { ...g, claimedAt: new Date() } : g));
        setSuccess("✅ Gift claimed! Check your inventory.");
      } else {
        const error = await res.json();
        setError(`❌ ${error.error}`);
      }
    } catch (error) {
      console.error("Error claiming gift:", error);
      setError("❌ Failed to claim gift");
    } finally {
      setClaiming(null);
    }
  }

  async function handleAcceptBet(betId) {
    setProcessingBet({ betId, action: 'accept' });
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
        // Reload after a short delay to show the notification being removed
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const error = await res.json();
        setError(`❌ ${error.error}`);
      }
    } catch (error) {
      console.error("Error accepting bet:", error);
      setError("❌ Failed to accept bet");
    } finally {
      setProcessingBet(null);
    }
  }

  async function handleDenyBet(betId) {
    setProcessingBet({ betId, action: 'deny' });
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/bets/deny", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId }),
      });

      if (res.ok) {
        setSuccess("✅ Bet denied. Coins refunded to challenger.");
        // Dispatch event to notify other components to refresh
        window.dispatchEvent(new CustomEvent("betsUpdated"));
        window.location.reload();
      } else {
        const error = await res.json();
        setError(`❌ ${error.error}`);
      }
    } catch (error) {
      console.error("Error denying bet:", error);
      setError("❌ Failed to deny bet");
    } finally {
      setProcessingBet(null);
    }
  }

  const getNotificationIcon = (type) => {
    const icons = {
      friend_catching_up: "🏃",
      streak_milestone: "🔥",
      missed_day: "😢",
      streak_broken: "💔",
      gift_received: "🎁",
      bet_requested: "🎯",
      bet_accepted: "✅",
      bet_denied: "❌",
      bet_expired: "⏰",
    };
    return icons[type] || "📢";
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm mb-4">
          {success}
        </div>
      )}
      {initialNotifications.length === 0 && gifts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Gifts */}
          {gifts.map((gift) => {
            const isClaimed = gift.claimedAt !== null;
            return (
              <div
                key={`gift-${gift.id}`}
                className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Gift from <strong>{gift.sender.displayName || gift.sender.username}</strong>
                    </p>
                    <p className="text-lg font-semibold text-purple-900 mt-1">
                      🎁 {gift.itemName}
                    </p>
                    {gift.message && (
                      <p className="text-sm text-purple-800 mt-2 italic">"{gift.message}"</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(gift.createdAt).toISOString().split('T')[0]}
                    </p>
                  </div>

                  {!isClaimed ? (
                    <button
                      onClick={() => handleClaimGift(gift.id)}
                      disabled={claiming === gift.id}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition whitespace-nowrap disabled:opacity-50"
                    >
                      {claiming === gift.id ? "Claiming..." : "Claim Gift"}
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold whitespace-nowrap">
                      ✓ Claimed
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Regular Notifications */}
          {initialNotifications.map((notif) => {
            let metadata = {};
            try {
              metadata = notif.metadata ? JSON.parse(notif.metadata) : {};
            } catch (e) {
              // ignore parse errors
            }

            const isBetRequest = notif.type === "bet_requested";
            const isProcessing = processingBet?.betId === metadata.betId;

            return (
              <div
                key={`notif-${notif.id}`}
                className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{getNotificationIcon(notif.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      {new Date(notif.createdAt).toISOString().split('T')[0]}
                    </p>
                    <p className="text-gray-900">{notif.message}</p>
                    {isBetRequest && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAcceptBet(metadata.betId)}
                          disabled={isProcessing && processingBet.action === 'accept'}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-sm disabled:opacity-50"
                        >
                          {isProcessing && processingBet.action === 'accept' ? "Accepting..." : "Accept"}
                        </button>
                        <button
                          onClick={() => handleDenyBet(metadata.betId)}
                          disabled={isProcessing && processingBet.action === 'deny'}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition text-sm disabled:opacity-50"
                        >
                          {isProcessing && processingBet.action === 'deny' ? "Denying..." : "Deny"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
