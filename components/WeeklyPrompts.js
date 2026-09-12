"use client";
import { useState, useEffect } from "react";

export default function WeeklyPrompts() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrompts() {
      try {
        const res = await fetch("/api/weekly-analysis");
        if (res.ok) {
          const data = await res.json();
          setPrompts(data.prompts || []);
        }
      } catch (error) {
        console.error("Error fetching weekly prompts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPrompts();
  }, []);

  if (loading) {
    return null;
  }

  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-2">
      {prompts.map((prompt, index) => (
        <div
          key={index}
          className="flex items-center gap-2 text-sm text-blue-800 bg-blue-100 px-3 py-2 rounded-md border border-blue-200"
        >
          <span className="text-lg">💪</span>
          <span>{prompt.message}</span>
        </div>
      ))}
    </div>
  );
}
