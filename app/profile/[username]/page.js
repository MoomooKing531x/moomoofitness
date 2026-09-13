"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import PasswordResetModal from "../../../components/PasswordResetModal";
import FriendNotificationToggle from "../../../components/FriendNotificationToggle";
import StatsPrivacySettings from "../../../components/StatsPrivacySettings";
import CharacterProfile from "../../../components/CharacterProfile";
import ProfileBetButton from "../../../components/ProfileBetButton";
import ComplimentButton from "../../../components/ComplimentButton";
import CoinIcon from "../../../components/CoinIcon";
import ResetAccountButton from "../../../components/ResetAccountButton";
import DeleteAccountButton from "../../../components/DeleteAccountButton";
import EditAccountModal from "../../../components/EditAccountModal";

export default function ProfilePage({ params }) {
  const [profileUser, setProfileUser] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [stats, setStats] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, meRes] = await Promise.all([
          fetch(`/api/user/profile?username=${params.username}`),
          fetch("/api/auth/me"),
        ]);

        const profileData = await profileRes.json();
        const meData = await meRes.json();

        if (!profileData.ok || !meData.ok) {
          window.location.href = "/dashboard";
          return;
        }

        setProfileUser(profileData.user);
        setViewer(meData.user);

        // Fetch stats if can view
        if (profileData.canViewStats) {
          const statsRes = await fetch(`/api/stats/logs?userId=${profileData.user.id}`);
          const statsData = await statsRes.json();
          setStats(statsData.stats || []);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.username]);

  const handleSaveAccount = async (data) => {
    const res = await fetch("/api/user/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setIsEditModalOpen(false);
      window.location.reload();
    }
  };

  const handleDownloadLogs = () => {
    window.location.href = "/api/logs/download";
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!profileUser || !viewer) {
    return <div className="flex justify-center items-center h-screen">User not found</div>;
  }

  const isYou = profileUser.id === viewer.id;
  const streak = profileUser.currentStreak || 0;
  const status = profileUser.lastLoggedDate ? "active" : "none";

  return (
    <div>
      <Navbar
        username={viewer.username}
        displayName={viewer.displayName}
        currentStreak={viewer.currentStreak || 0}
        streakStatus={viewer.lastLoggedDate ? "active" : "none"}
        elo={viewer.elo || 0}
        coins={viewer.coins || 0}
        maxGameLevelReached={viewer.maxGameLevelReached || 1}
      />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/dashboard" className="text-sm text-gray-500 underline">
          ← Back to dashboard
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
          {/* Left: Character Profile */}
          <div className="md:col-span-1 flex justify-center md:justify-start">
            <CharacterProfile 
              equippedHat={profileUser.equippedHat} 
              equippedJacket={profileUser.equippedJacket}
              equippedAccessory={profileUser.equippedAccessory}
            />
          </div>

          {/* Right: Profile Info */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-semibold mb-1">
              {profileUser.username} {isYou && <span className="text-gray-400 text-lg">(you)</span>}
            </h1>
            {profileUser.displayName && (
              <p className="text-sm text-gray-500 mb-2">
                "{profileUser.displayName}"
              </p>
            )}
            {profileUser.age && (
              <p className="text-sm text-gray-500 mb-2">
                Age: <strong>{profileUser.age}</strong>
              </p>
            )}
            {profileUser.gender && (
              <p className="text-sm text-gray-500 mb-2">
                Gender: <strong className="capitalize">{profileUser.gender === "prefer-not-to-say" ? "Prefer not to say" : profileUser.gender}</strong>
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              {status === "active" && `${streak} day streak (active)`}
              {status === "none" && "No active streak"}
            </p>

            {/* Stats */}
            <div className="bg-white border rounded-lg p-4 mb-4">
              <h2 className="text-lg font-semibold mb-3">Exercise Stats</h2>
              {stats.length > 0 ? (
                <div className="space-y-2">
                  {stats.map((stat) => (
                    <div key={stat.exercise.id} className="flex justify-between text-sm">
                      <span>{stat.exercise.name}</span>
                      <span className="font-semibold">{stat.total}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No exercises logged yet.</p>
              )}
            </div>

            {/* Currency Stats */}
            <div className="grid grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-600"><strong>ELO</strong></span>
                <div className="font-semibold text-lg">{Math.round(profileUser.elo || 0).toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">Exercise Points</p>
              </div>
              <div>
                <span className="text-gray-600"><strong>GP</strong></span>
                <div className="font-semibold text-lg">{Math.round(profileUser.gp || 0).toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">Game Points</p>
              </div>
              <div>
                <CoinIcon size={20} className="text-yellow-600 mb-2" />
                <div className="font-semibold text-lg text-yellow-600">{Math.round(profileUser.coins || 0).toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">Coins</p>
              </div>
              <div>
                <span className="text-gray-600"><strong>Rep Defense</strong></span>
                <div className="font-semibold text-lg">{profileUser.maxGameLevelReached || 1}</div>
                <p className="text-xs text-gray-500 mt-1">Max Level</p>
              </div>
            </div>

            {/* Actions */}
            {isYou && (
              <div className="space-y-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Edit Account
                </button>
                <button
                  onClick={handleDownloadLogs}
                  className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Download All Logs
                </button>
                <ProfileBetButton friendId={profileUser.id} friendName={profileUser.displayName || profileUser.username} userCoins={viewer.coins || 0} />
                <ComplimentButton friendId={profileUser.id} friendName={profileUser.displayName || profileUser.username} userCoins={viewer.coins || 0} />
                <PasswordResetModal />
                <FriendNotificationToggle />
                <StatsPrivacySettings />
                <ResetAccountButton />
                <DeleteAccountButton />
              </div>
            )}
          </div>
        </div>
      </main>

      <EditAccountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveAccount}
        currentData={{
          displayName: profileUser.displayName,
          age: profileUser.age,
          gender: profileUser.gender,
        }}
      />
    </div>
  );
}
