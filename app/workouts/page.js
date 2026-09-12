"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { getWorkoutIcon } from "../../components/WorkoutIcons";

const EXERCISE_DESCRIPTIONS = {
  "push-ups": "Place hands shoulder-width apart, lower your body until chest nearly touches floor, then push back up. Core and arm strength exercise.",
  "pull-ups": "Grip bar with hands shoulder-width apart, pull yourself up until chin is above bar, then lower with control. Upper back and arm builder.",
  "dips": "Support yourself on parallel bars, lower body by bending elbows, then push back up. Chest and tricep focused.",
  "chin-ups": "Grip bar with palms facing you, pull yourself up until chin clears bar, then lower with control. Builds back and arm strength.",
  "muscle-ups": "Advanced movement: pull yourself up above the bar, then press your body upward. Elite full-body strength move.",
  "handstand push-ups": "Kick up into handstand against wall, lower head toward ground by bending elbows, then push back up. Shoulder and core intensive.",
  "squats": "Feet shoulder-width apart, lower hips back and down, keep weight in heels, then stand back up. Leg strength foundation.",
  "jump squats": "Squat down, explode upward into jump, land softly, repeat immediately. Explosive leg power builder.",
  "pistol squats": "Single-leg squat holding arms forward for balance, lower as far as possible, stand back up. Advanced unilateral leg strength.",
  "bulgarian split squats": "Rear foot elevated on bench, front leg forward, lower back knee toward ground, stand back up. Single-leg strength builder.",
  "sit-ups": "Lie on back with knees bent, crunch torso up toward knees, lower back down. Abdominal strength exercise.",
  "hanging leg raises": "Hang from bar, raise legs up keeping them straight or slightly bent, lower under control. Core and hip flexor builder.",
  "toes-to-bar": "Hang from bar, raise legs to touch bar with toes, lower under control. Advanced core and hip flexor exercise.",
  "plank": "Hold push-up position on forearms and toes, maintain straight body alignment, keep core engaged. Isometric core strengthener.",
  "dead hang": "Simply hang from bar with arms extended, keep body straight and relaxed. Grip strength and shoulder mobility.",
  "wall sit": "Back against wall, slide down into sitting position with thighs parallel to ground, hold. Isometric quad strengthener.",
  "hollow body hold": "Lie on back, press lower back into ground, point toes, reach arms overhead, hold. Core stability builder.",
  "handstand hold": "Hold a handstand position, maintain body alignment and balance. Shoulder stability and body control.",
  "l-sit": "Support yourself on parallel bars or ground, hold legs straight out in front, maintain level body. Core and hip flexor strength.",
  "running": "Continuous forward movement, focus on steady pace and proper breathing. Cardiovascular endurance builder.",
};

export default function WorkoutsPage() {
  const [userStats, setUserStats] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    async function fetchUserStats() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserStats(data.user);
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    }
    fetchUserStats();
  }, []);

  const exercises = Object.keys(EXERCISE_DESCRIPTIONS);
  const categories = {
    "Upper Body": ["push-ups", "pull-ups", "dips", "chin-ups", "muscle-ups", "handstand push-ups"],
    "Lower Body": ["squats", "jump squats", "pistol squats", "bulgarian split squats"],
    "Core & Isometric": ["sit-ups", "hanging leg raises", "toes-to-bar", "plank", "dead hang", "wall sit", "hollow body hold", "handstand hold", "l-sit"],
    "Activities": ["running"],
  };

  return (
    <div>
      <Navbar
        username={userStats?.username || ""}
        displayName={userStats?.displayName || ""}
        currentStreak={0}
        points={0}
        elo={0}
      />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Link href="/dashboard" className="text-sm text-gray-500 underline mb-6 inline-block">
          ← Back to dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">Workouts</h1>
        <p className="text-gray-600 mb-10">Learn how to properly perform every exercise in MoomooFitness</p>

        {selectedExercise ? (
          <div className="bg-white border rounded-lg p-8">
            <button
              onClick={() => setSelectedExercise(null)}
              className="text-sm text-gray-500 underline mb-6"
            >
              ← Back to all exercises
            </button>

            <div className="flex items-start gap-8">
              <div className="text-blue-600 flex-shrink-0">
                {getWorkoutIcon(selectedExercise)}
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-4 capitalize">{selectedExercise}</h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {EXERCISE_DESCRIPTIONS[selectedExercise]}
                </p>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Form Tips:</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Keep your core engaged throughout the movement</li>
                    <li>Maintain steady, controlled breathing</li>
                    <li>Focus on proper form over speed or quantity</li>
                    <li>Rest as needed between sets</li>
                    <li>Increase difficulty gradually as you get stronger</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(categories).map(([category, categoryExercises]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">{category}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryExercises.map((exercise) => (
                    <button
                      key={exercise}
                      onClick={() => setSelectedExercise(exercise)}
                      className="bg-white border rounded-lg p-6 hover:shadow-lg hover:border-blue-500 transition text-center cursor-pointer group"
                    >
                      <div className="text-blue-600 group-hover:text-blue-700 flex justify-center mb-3">
                        {getWorkoutIcon(exercise)}
                      </div>
                      <h3 className="font-semibold capitalize text-gray-900 group-hover:text-blue-600 transition">
                        {exercise}
                      </h3>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
