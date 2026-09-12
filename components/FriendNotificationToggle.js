"use client";
import { useState, useEffect } from "react";

export default function FriendNotificationToggle({ friendId, friendUsername }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreference();
  }, [friendId]);

  async function fetchPreference() {
    try {
      const res = await fetch(`/api/notifications/friend-preference?friendId=${friendId}`);
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(data.enabled);
      }
    } catch (error) {
      console.error("Error fetching preference:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/friend-preference", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendId,
          enabled: !isEnabled,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(data.enabled);
      }
    } catch (error) {
      console.error("Error updating preference:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Notifications</h3>
          <p className="text-sm text-gray-600">
            {isEnabled
              ? `You'll be notified about ${friendUsername}'s achievements and streaks`
              : `You won't receive notifications about ${friendUsername}`}
          </p>
        </div>
        <button
          onClick={toggleNotifications}
          disabled={loading}
          className={`px-4 py-2 rounded-md font-semibold text-sm transition ${
            isEnabled
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-700 hover:bg-gray-400"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "..." : isEnabled ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}
