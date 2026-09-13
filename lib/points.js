// Points multiplier system based on exercise difficulty
// Harder exercises give more points per unit

const POINTS_MULTIPLIERS = {
  // Upper body (reps) - Pull-ups are hardest, so highest multiplier
  "pull-ups": 10,
  "chin-ups": 9,
  "muscle-ups": 15, // Elite move, highest multiplier
  "push-ups": 3,
  "dips": 8,
  "pike push-ups": 5,
  "handstand push-ups": 12,

  // Lower body (reps)
  "squats": 2,
  "bulgarian split squats": 4,
  "pistol squats": 10,
  "jump squats": 3,

  // Core & isometric (reps)
  "sit-ups": 1,
  "hanging leg raises": 5,
  "toes-to-bar": 7,

  // Core & isometric (seconds) - 1 second = 1 point typically, unless very hard
  "plank": 1,
  "hollow body hold": 2,
  "dead hang": 1,
  "wall sit": 1,
  "handstand hold": 4,
};

// ELO multipliers based on exercise difficulty
// Using the exact values you specified:
// Activities: Running = 25 ELO per km
// Isometric: L-Sit 3.5/sec, Dead Hang 1/sec, Plank 1.5/sec, Wall Sit 1.5/sec, Hollow Body Hold 2/sec, Handstand Hold 4/sec
// Core: Sit-ups 2/rep, Hanging Leg Raises 5/rep, Toes-to-Bar 7/rep
// Lower Body: Squats 2/rep, Jump Squats 3/rep, Bulgarian Split Squats 4/rep, Pistol Squats 8/rep
// Upper Body: Push-ups 3/rep, Pike Push-ups 4/rep, Neutral-grip pull-ups 6.5/rep, Chin-ups 6/rep, Pull-ups 7/rep, Dips 7/rep, Muscle-ups 12/rep, Handstand Push-ups 15/rep

const ELO_MULTIPLIERS = {
  // Activities
  "running": 120, // per km (120 ELO per kilometer)
  
  // Upper body (reps)
  "handstand push-ups": 15,
  "muscle-ups": 12,
  "pull-ups": 7,
  "dips": 7,
  "neutral-grip pull-ups": 6.5,
  "chin-ups": 6,
  "pike push-ups": 4,
  "push-ups": 3,

  // Lower body (reps)
  "pistol squats": 8,
  "bulgarian split squats": 4,
  "jump squats": 3,
  "squats": 2,

  // Core (reps)
  "toes-to-bar": 7,
  "hanging leg raises": 5,
  "sit-ups": 2,

  // Core & isometric (seconds)
  "handstand hold": 4,
  "hollow body hold": 2,
  "plank": 1.5,
  "wall sit": 1.5,
  "l-sit": 3.5,
  "dead hang": 1,
};

/**
 * Normalize exercise name for matching
 * Handles variations in capitalization, hyphens, spaces, etc.
 * @param {string} name - Exercise name
 * @returns {string} Normalized name
 */
function normalizeExerciseName(name) {
  return name
    .toLowerCase()
    .replace(/-/g, ' ')          // Replace hyphens with spaces
    .replace(/_/g, ' ')          // Replace underscores with spaces
    .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
    .trim();                     // Remove leading/trailing spaces
}

/**
 * Calculate points for a logged exercise
 * @param {Object} exercise - Exercise object with name, unit
 * @param {number} amount - Amount logged (reps or seconds)
 * @returns {number} Points earned
 */
function calculatePoints(exercise, amount) {
  const normalized = normalizeExerciseName(exercise.name);
  const multiplier = POINTS_MULTIPLIERS[normalized] || 2; // Default 2x for unknown exercises
  return amount * multiplier;
}

/**
 * Calculate ELO for a logged exercise
 * @param {Object} exercise - Exercise object with name, unit
 * @param {number} amount - Amount logged (reps or seconds)
 * @returns {number} ELO earned
 */
function calculateElo(exercise, amount) {
  const normalized = normalizeExerciseName(exercise.name);
  const multiplier = ELO_MULTIPLIERS[normalized] || 0.5; // Default 0.5x for unknown exercises
  return Math.round(amount * multiplier);
}

export { calculatePoints, POINTS_MULTIPLIERS, calculateElo, ELO_MULTIPLIERS };

