const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const exercises = [
  // Upper body
  { name: "Pull-ups", category: "upper", unit: "reps" },
  { name: "Chin-ups", category: "upper", unit: "reps" },
  { name: "Neutral-grip pull-ups", category: "upper", unit: "reps" },
  { name: "Muscle-ups", category: "upper", unit: "reps" },
  { name: "Push-ups", category: "upper", unit: "reps" },
  { name: "Dips", category: "upper", unit: "reps" },
  { name: "Pike Push-ups", category: "upper", unit: "reps" },
  { name: "Handstand Push-ups", category: "upper", unit: "reps" },
  // Lower body
  { name: "Squats", category: "lower", unit: "reps" },
  { name: "Bulgarian Split Squats", category: "lower", unit: "reps" },
  { name: "Pistol Squats", category: "lower", unit: "reps" },
  { name: "Jump Squats", category: "lower", unit: "reps" },
  // Core & isometric
  { name: "Sit-ups", category: "core", unit: "reps" },
  { name: "Hanging Leg Raises", category: "core", unit: "reps" },
  { name: "Toes-to-Bar", category: "core", unit: "reps" },
  { name: "L-Sit", category: "core", unit: "seconds" },
  { name: "Plank", category: "core", unit: "seconds" },
  { name: "Hollow Body Hold", category: "core", unit: "seconds" },
  { name: "Dead Hang", category: "core", unit: "seconds" },
  { name: "Wall Sit", category: "core", unit: "seconds" },
  { name: "Handstand Hold", category: "core", unit: "seconds" },
  // Cardio
  { name: "Running", category: "cardio", unit: "km" },
  // Additional exercises
  { name: "Neutral-grip Pullups", category: "upper", unit: "reps" },
];

// Troop types for each exercise (simplified to 10 with clear progression)
const troopTypes = [
  // Tier 1: Basic weak troops (10GP)
  { name: "Recruit", damage: 1, cost: 10, attackSpeed: 3.0, maxHits: 3, difficultyTier: "low", color: "#C9ADA7", shape: "circle" },
  // Tier 2: Slightly better (25GP)
  { name: "Soldier", damage: 2, cost: 25, attackSpeed: 2.8, maxHits: 4, difficultyTier: "low", color: "#9A8C98", shape: "circle" },
  // Tier 3: Medium strength (50GP)
  { name: "Warrior", damage: 3, cost: 50, attackSpeed: 2.5, maxHits: 5, difficultyTier: "medium", color: "#8B7E74", shape: "square" },
  // Tier 4: Better warrior (100GP)
  { name: "Knight", damage: 4, cost: 100, attackSpeed: 2.3, maxHits: 6, difficultyTier: "medium", color: "#6D6875", shape: "square" },
  // Tier 5: Elite soldier (200GP)
  { name: "Elite", damage: 5, cost: 200, attackSpeed: 2.0, maxHits: 7, difficultyTier: "medium", color: "#B5838D", shape: "triangle" },
  // Tier 6: Strong elite (350GP)
  { name: "Champion", damage: 6, cost: 350, attackSpeed: 1.8, maxHits: 8, difficultyTier: "high", color: "#E5989B", shape: "triangle" },
  // Tier 7: Advanced (500GP)
  { name: "Hero", damage: 8, cost: 500, attackSpeed: 1.6, maxHits: 10, difficultyTier: "high", color: "#FFB6B9", shape: "star" },
  // Tier 8: Master (650GP)
  { name: "Master", damage: 10, cost: 650, attackSpeed: 1.4, maxHits: 12, difficultyTier: "high", color: "#FF5252", shape: "star" },
  // Tier 9: Elite master (800GP)
  { name: "Legend", damage: 12, cost: 800, attackSpeed: 1.2, maxHits: 15, difficultyTier: "high", color: "#FF6B6B", shape: "star" },
  // Tier 10: Ultimate (1000GP)
  { name: "Titan", damage: 15, cost: 1000, attackSpeed: 1.0, maxHits: 20, difficultyTier: "high", color: "#FF8E72", shape: "star" },
];

async function main() {
  try {
    console.log("Starting seed...");
    
    // Seed exercises - use upsert to avoid timeouts
    let createdCount = 0;
    for (const ex of exercises) {
      const normalizedName = ex.name.trim().toLowerCase();
      try {
        await prisma.exercise.upsert({
          where: { normalizedName },
          update: {},
          create: {
            ...ex,
            normalizedName,
            isOfficial: true,
            isPublic: true,
          },
        });
        createdCount++;
      } catch (err) {
        console.warn(`Exercise ${ex.name}: ${err.message}`);
      }
    }
    console.log(`Processed ${createdCount} exercises.`);

    // Seed troop types
    let troopCount = 0;
    for (const troop of troopTypes) {
      try {
        await prisma.troopType.create({
          data: {
            name: troop.name,
            damage: troop.damage,
            cost: troop.cost,
            attackSpeed: troop.attackSpeed,
            maxHits: troop.maxHits || 3,
            difficultyTier: troop.difficultyTier,
            color: troop.color || "#4ECDC4",
            shape: troop.shape || "circle",
          },
        }).catch(() => {
          // Ignore duplicate name errors
        });
        troopCount++;
      } catch (err) {
        // Silently skip duplicates
      }
    }
    console.log(`Processed ${troopCount} troop types.`);
    console.log("Seed completed!");
  } catch (err) {
    console.error("Fatal seed error:", err);
    throw err;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
