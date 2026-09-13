import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../../lib/db";
import { getUserIdFromCookies } from "../../../lib/auth";
import { getStreakDisplay } from "../../../lib/streak";
import Navbar from "../../../components/Navbar";
import PasswordResetModal from "../../../components/PasswordResetModal";
import FriendNotificationToggle from "../../../components/FriendNotificationToggle";
import StatsPrivacySettings from "../../../components/StatsPrivacySettings";
import CharacterProfile from "../../../components/CharacterProfile";
import ProfileBetButton from "../../../components/ProfileBetButton";
import ComplimentButton from "../../../components/ComplimentButton";
import CoinIcon from "../../../components/CoinIcon";
import ResetAccountButton from "../../../components/ResetAccountButton";

export default async function ProfilePage({ params }) {
  const viewerId = getUserIdFromCookies();
  if (!viewerId) redirect("/login");

  const viewer = await prisma.user.findUnique({ where: { id: viewerId } });
  if (!viewer) redirect("/login");

  const profileUser = await prisma.user.findUnique({
    where: { username: params.username },
  });
  if (!profileUser) redirect("/dashboard");

  const isYou = profileUser.id === viewerId;

  // Check stats privacy
  let canViewStats = isYou; // Can always view your own stats
  if (!isYou) {
    if (profileUser.statsVisibility === "public") {
      canViewStats = true;
    } else if (profileUser.statsVisibility === "friends") {
      // Check if they're friends
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: "accepted",
          OR: [
            { requesterId: viewerId, addresseeId: profileUser.id },
            { requesterId: profileUser.id, addresseeId: viewerId },
          ],
        },
      });
      canViewStats = !!friendship;
    } else {
      canViewStats = false; // "nobody"
    }
  }

  // Only fetch stats if user can view them
  let stats = [];
  if (canViewStats) {
    const totalsByExercise = await prisma.log.groupBy({
      by: ["exerciseId"],
      where: { userId: profileUser.id },
      _sum: { amount: true },
    });

    const exercises = await prisma.exercise.findMany({
      where: { id: { in: totalsByExercise.map((t) => t.exerciseId) } },
    });
    const exerciseById = Object.fromEntries(exercises.map((e) => [e.id, e]));

    stats = totalsByExercise
      .map((t) => ({
        exercise: exerciseById[t.exerciseId],
        total: t._sum.amount || 0,
      }))
      .filter((s) => s.exercise)
      .sort((a, b) => a.exercise.name.localeCompare(b.exercise.name));
  }

  const { streak, status } = getStreakDisplay(profileUser);

  const viewerStreak = getStreakDisplay(viewer);

  return (
    <div>
      <Navbar
        username={viewer.username}
        displayName={viewer.displayName}
        currentStreak={viewerStreak.streak}
        streakStatus={viewerStreak.status}
        elo={viewer.elo || 0}
        coins={viewer.coins || 0}
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
            {profileUser.gender && (
              <p className="text-sm text-gray-500 mb-2">
                Gender: <strong className="capitalize">{profileUser.gender === "prefer-not-to-say" ? "Prefer not to say" : profileUser.gender}</strong>
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              {status === "active" && `${streak} day streak (active)`}
              {status === "grace" && `${streak} day streak — hasn't logged today yet`}
              {(status === "broken" || status === "none") && "No active streak"}
              {" · "}Longest streak: {profileUser.longestStreak} day
              {profileUser.longestStreak === 1 ? "" : "s"}
            </p>

            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Currencies</h2>
              {!canViewStats && !isYou ? (
                <div className="text-sm text-gray-600 p-3 bg-gray-100 rounded border border-gray-300">
                  User has privated their stats
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600"><strong>ELO</strong></span>
                    <div className="font-semibold text-lg">{(profileUser.elo || 0).toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">Exercise Points</p>
                  </div>
                  <div>
                    <span className="text-gray-600"><strong>GP</strong></span>
                    <div className="font-semibold text-lg">{(profileUser.elo || 0).toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">Game Points</p>
                  </div>
                  <div>
                    <CoinIcon size={20} className="text-yellow-600" />
                    <div className="font-semibold text-lg text-yellow-600">{(profileUser.coins || 0).toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">Coins</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h2 className="text-sm font-semibold text-blue-900 mb-3">Challenge & Workout Stats</h2>
              {!canViewStats && !isYou ? (
                <div className="text-sm text-blue-700 p-3 bg-blue-100 rounded border border-blue-300">
                  User has privated their stats
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700"><strong>Daily Challenge Streak</strong></span>
                    <div className="font-semibold text-lg text-blue-600">{(profileUser.dailyChallengeStreak || 0)}</div>
                    <p className="text-xs text-blue-600 mt-1">{(profileUser.totalDailyChallengesDone || 0)} total completed</p>
                  </div>
                  <div>
                    <span className="text-blue-700"><strong>Workout Streak</strong></span>
                    <div className="font-semibold text-lg text-blue-600">{(profileUser.currentStreak || 0)}</div>
                    <p className="text-xs text-blue-600 mt-1">{(profileUser.totalWorkoutDaysDone || 0)} total days</p>
                  </div>
                </div>
              )}
            </div>

            {isYou && (
              <div className="space-y-6 mb-6">
                <PasswordResetModal userId={viewerId} />
                <StatsPrivacySettings />
                <ResetAccountButton />
              </div>
            )}

            {!isYou && (
              <div className="space-y-3 mb-6">
                <FriendNotificationToggle friendId={profileUser.id} friendUsername={profileUser.username} />
                <ProfileBetButton friendId={profileUser.id} friendName={profileUser.displayName || profileUser.username} userCoins={viewer.coins || 0} />
                <ComplimentButton friendId={profileUser.id} friendName={profileUser.displayName || profileUser.username} userCoins={viewer.coins || 0} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">All-time totals</h2>
          {!canViewStats && !isYou ? (
            <div className="text-sm text-gray-600 p-4 bg-gray-100 rounded border border-gray-300">
              User has privated their stats
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md divide-y">
            {stats.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No exercises logged yet.</p>
            )}
            {stats.map((s) => (
              <div key={s.exercise.id} className="flex justify-between items-center px-4 py-3 text-sm hover:bg-gray-50">
                <Link href={`/leaderboard/${s.exercise.id}`} className="hover:underline flex-1">
                  {s.exercise.name}
                </Link>
                <span className="mr-4">
                  {s.total} {s.exercise.unit}
                </span>
                {isYou && (
                  <Link 
                    href={`/stats/${s.exercise.id}`}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Graph
                  </Link>
                )}
              </div>
            ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
