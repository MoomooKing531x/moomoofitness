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

// Troop types - 20 unique troops with Battle Cats style progression (quality > quantity)
const troopTypes = [
  // Tier 1: Trash tier - 1-5 GP, extremely weak
  { name: "Scrap", damage: 1, cost: 1, attackSpeed: 4.0, maxHits: 1, difficultyTier: "low", color: "#808080", shape: "circle" },
  { name: "Peasant", damage: 1, cost: 2, attackSpeed: 3.8, maxHits: 1, difficultyTier: "low", color: "#A9A9A9", shape: "circle" },
  { name: "Rat", damage: 2, cost: 3, attackSpeed: 3.5, maxHits: 1, difficultyTier: "low", color: "#B87333", shape: "circle" },
  { name: "Goblin", damage: 2, cost: 5, attackSpeed: 3.2, maxHits: 2, difficultyTier: "low", color: "#556B2F", shape: "square" },
  
  // Tier 2: Basic tier - 10-25 GP, weak but usable
  { name: "Recruit", damage: 3, cost: 10, attackSpeed: 3.0, maxHits: 2, difficultyTier: "low", color: "#C9ADA7", shape: "square" },
  { name: "Slime", damage: 3, cost: 15, attackSpeed: 2.8, maxHits: 3, difficultyTier: "low", color: "#7FFFD4", shape: "circle" },
  { name: "Bat", damage: 4, cost: 20, attackSpeed: 2.5, maxHits: 2, difficultyTier: "low", color: "#4B0082", shape: "triangle" },
  { name: "Wolf", damage: 5, cost: 25, attackSpeed: 2.3, maxHits: 3, difficultyTier: "low", color: "#8B4513", shape: "triangle" },
  
  // Tier 3: Medium tier - 50-150 GP, balanced
  { name: "Soldier", damage: 6, cost: 50, attackSpeed: 2.0, maxHits: 4, difficultyTier: "medium", color: "#9A8C98", shape: "square" },
  { name: "Archer", damage: 8, cost: 75, attackSpeed: 1.8, maxHits: 3, difficultyTier: "medium", color: "#6B8E23", shape: "triangle" },
  { name: "Warrior", damage: 10, cost: 100, attackSpeed: 1.6, maxHits: 5, difficultyTier: "medium", color: "#8B7E74", shape: "square" },
  { name: "Knight", damage: 12, cost: 150, attackSpeed: 1.5, maxHits: 6, difficultyTier: "medium", color: "#6D6875", shape: "star" },
  
  // Tier 4: Elite tier - 200-500 GP, strong
  { name: "Mage", damage: 15, cost: 200, attackSpeed: 1.3, maxHits: 4, difficultyTier: "high", color: "#4169E1", shape: "star" },
  { name: "Elite", damage: 18, cost: 250, attackSpeed: 1.2, maxHits: 5, difficultyTier: "high", color: "#B5838D", shape: "star" },
  { name: "Samurai", damage: 22, cost: 350, attackSpeed: 1.1, maxHits: 6, difficultyTier: "high", color: "#DC143C", shape: "star" },
  { name: "Champion", damage: 25, cost: 500, attackSpeed: 1.0, maxHits: 7, difficultyTier: "high", color: "#E5989B", shape: "star" },
  
  // Tier 5: Legendary tier - 750-2000 GP, very strong
  { name: "Hero", damage: 35, cost: 750, attackSpeed: 0.9, maxHits: 8, difficultyTier: "high", color: "#FFB6B9", shape: "star" },
  { name: "Dragon", damage: 50, cost: 1000, attackSpeed: 0.8, maxHits: 10, difficultyTier: "high", color: "#FF4500", shape: "star" },
  { name: "Legend", damage: 75, cost: 1500, attackSpeed: 0.7, maxHits: 12, difficultyTier: "high", color: "#FF6B6B", shape: "star" },
  { name: "Titan", damage: 100, cost: 2000, attackSpeed: 0.5, maxHits: 15, difficultyTier: "high", color: "#FF8E72", shape: "star" },
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
