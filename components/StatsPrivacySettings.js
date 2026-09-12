"use client";
import { useState, useEffect } from "react";

export default function StatsPrivacySettings() {
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVisibility();
  }, []);

  async function fetchVisibility() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/users/stats-visibility");
      if (res.ok) {
        const data = await res.json();
        setVisibility(data.statsVisibility || "public");
      } else if (res.status === 401) {
        console.log("Not authenticated");
      } else {
        setError("Failed to load settings");
      }
    } catch (error) {
      console.error("Error fetching stats visibility:", error);
      setError("Error loading settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleChange(newVisibility) {
    setLoading(true);
    setSaved(false);
    setError("");
    
    try {
      const res = await fetch("/api/users/stats-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statsVisibility: newVisibility }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setVisibility(data.statsVisibility);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError("Failed to save settings");
        console.error("API error:", res.status);
      }
    } catch (error) {
      console.error("Error updating stats visibility:", error);
      setError("Error saving settings");
    } finally {
      setLoading(false);
    }
  }

  const options = [
    {
      value: "public",
      label: "Public",
      description: "Everyone can see your stats",
    },
    {
      value: "friends",
      label: "Friends Only",
      description: "Only your friends can see your stats",
    },
    {
      value: "nobody",
      label: "Private",
      description: "No one can see your stats",
    },
  ];

  return (
    <div className="p-4 bg-green-50 rounded-md border border-green-200">
      <h3 className="font-semibold text-gray-900 mb-3">Share Stats</h3>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-start p-3 border rounded-md cursor-pointer transition ${
              visibility === option.value
                ? "border-green-500 bg-white"
                : "border-gray-200 hover:bg-white"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name="stats-visibility"
              value={option.value}
              checked={visibility === option.value}
              onChange={() => handleChange(option.value)}
              disabled={loading}
              className="mt-1 mr-3 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-600">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
      {saved && (
        <div className="mt-3 text-sm text-green-600 font-semibold animate-pulse">
          ✓ Privacy settings updated
        </div>
      )}
    </div>
  );
}
