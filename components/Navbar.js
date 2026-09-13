"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import NotificationBell from "./NotificationBell";
import ClothingCustomizer from "./ClothingCustomizer";
import CoinIcon from "./CoinIcon";

import { IconFire } from "./Icons";

const STATUS_DISPLAY = {
  active: (streak) => ({ icon: "🔥", label: `${streak}`, title: "" }),
  grace: (streak) => ({
    icon: "⏸️",
    label: `${streak}`,
    title: "One last chance! Log something today to keep your streak.",
  }),
  broken: () => ({ icon: "💤", label: "0", title: "" }),
  none: () => ({ icon: "💤", label: "0", title: "" }),
};

export default function Navbar({ username, displayName, currentStreak, streakStatus = "active", elo = 0, coins = 0, maxGameLevelReached = 1 }) {
  const router = useRouter();
  const display = (STATUS_DISPLAY[streakStatus] || STATUS_DISPLAY.active)(currentStreak);
  const [liveElo, setLiveElo] = useState(elo);
  const [liveGP, setLiveGP] = useState(elo); // GP starts equal to ELO
  const [liveCoins, setLiveCoins] = useState(coins);

  // Round values for display (actual values remain as decimals in database)
  const displayElo = Math.round(liveElo);
  const displayGP = Math.round(liveGP);
  const displayCoins = Math.round(liveCoins);

  // Poll for real-time updates every 1 second
  useEffect(() => {
    // Fetch immediately on mount
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/game/me");
        if (res.ok) {
          const data = await res.json();
          setLiveElo(data.elo || 0);
          setLiveGP(data.gp || 0);
          setLiveCoins(data.coins || 0);
        }
      } catch (error) {
        console.error("Error fetching live stats:", error);
      }
    };

    fetchStats();

    // Listen for coin updates from game wins or purchases
    const handleCoinsUpdated = (event) => {
      setLiveCoins(event.detail.coins);
    };

    window.addEventListener('coinsUpdated', handleCoinsUpdated);

    // Then poll every second
    const interval = setInterval(fetchStats, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('coinsUpdated', handleCoinsUpdated);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <Link href="/dashboard" className="font-semibold">
        MoomooFitness
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/workouts" title="Workouts" className="text-gray-600 hover:text-gray-900 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="6" r="1.5" fill="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7.5v6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11h8" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14v3h6v-3" />
          </svg>
        </Link>
        <Link href="/leaderboard" className="text-sm text-gray-500 underline">
          Leaderboard
        </Link>
        <Link href="/compare" className="text-sm text-gray-500 underline">
          Compare Stats
        </Link>
        <Link href="/stats" className="text-sm text-gray-500 underline">
          Stats
        </Link>
        <Link href="/friends" className="text-sm text-gray-500 underline">
          Friends
        </Link>
        <Link href="/game" className="text-sm text-gray-500 underline">
          Rep Defense
        </Link>
        <Link href="/reviews" title="Reviews" className="text-gray-600 hover:text-gray-900 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span title="Exercise Points"><strong>ELO</strong></span>
            <span className="text-lg font-semibold">{displayElo.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span title="Game Points (spend to play)"><strong>GP</strong></span>
            <span className="text-lg font-semibold">{displayGP.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <CoinIcon size={18} className="text-yellow-600" />
            <span className="text-lg font-semibold text-yellow-600">{displayCoins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span title="Rep Defense Level"><strong>LVL</strong></span>
            <span className="text-lg font-semibold">{maxGameLevelReached}</span>
          </div>
        </div>
        <span className="text-sm text-gray-600" title={display.title}>
          {display.icon} {display.label}
        </span>
        <ClothingCustomizer />
        <NotificationBell />
        <Link href="/shop" title="Shop" className="text-gray-600 hover:text-gray-900 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </Link>
        <Link href={`/profile/${username}`} className="text-sm text-gray-600 underline">
          {username}
        </Link>
        <button onClick={handleLogout} className="text-sm underline text-gray-500">
          Log out
        </button>
      </div>
    </nav>
  );
}
