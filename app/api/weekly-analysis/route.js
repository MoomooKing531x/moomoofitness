import { prisma } from "../../../lib/db.js";
import { getUserIdFromCookies } from "../../../lib/auth.js";

export async function GET() {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });

  // Get logs from the last 7 days (previous week)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const logs = await prisma.log.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo },
    },
    include: {
      exercise: true,
    },
    orderBy: { date: "desc" },
  });

  // Group by day of week and exercise category
  const dayPatterns = {
    0: [], // Sunday
    1: [], // Monday
    2: [], // Tuesday
    3: [], // Wednesday
    4: [], // Thursday
    5: [], // Friday
    6: [], // Saturday
  };

  logs.forEach((log) => {
    const dayOfWeek = log.date.getDay();
    const exerciseName = log.exercise?.name || log.customName;
    const category = log.exercise?.category || "custom";

    dayPatterns[dayOfWeek].push({
      exerciseName,
      category,
      amount: log.amount,
    });
  });

  // Get today's day of week
  const today = new Date();
  const currentDayOfWeek = today.getDay();

  // Generate prompts based on what was done on this day last week
  const lastWeeksExercises = dayPatterns[currentDayOfWeek] || [];
  const prompts = [];

  // Category-based prompts
  const categoryPrompts = {
    upper: "ready for hitting upper body?",
    lower: "ready for hitting legs?",
    core: "ready for hitting core?",
    custom: "ready for a custom workout?",
  };

  // If there were exercises on this day last week, generate specific prompts
  if (lastWeeksExercises.length > 0) {
    const uniqueCategories = [...new Set(lastWeeksExercises.map(e => e.category))];

    uniqueCategories.forEach(cat => {
      if (categoryPrompts[cat]) {
        prompts.push({
          type: "category",
          message: categoryPrompts[cat],
          category: cat,
        });
      }
    });

    // Add specific exercise prompts
    const uniqueExercises = [...new Set(lastWeeksExercises.map(e => e.exerciseName))];
    if (uniqueExercises.length > 0) {
      const exerciseName = uniqueExercises[0];
      if (exerciseName.toLowerCase().includes("pushup") || exerciseName.toLowerCase().includes("bench")) {
        prompts.push({
          type: "specific",
          message: "Hitting chest again?",
          exercise: exerciseName,
        });
      } else if (exerciseName.toLowerCase().includes("squat") || exerciseName.toLowerCase().includes("leg")) {
        prompts.push({
          type: "specific",
          message: "Leg day again?",
          exercise: exerciseName,
        });
      } else if (exerciseName.toLowerCase().includes("situp") || exerciseName.toLowerCase().includes("crunch") || exerciseName.toLowerCase().includes("plank")) {
        prompts.push({
          type: "specific",
          message: "Hitting abs again?",
          exercise: exerciseName,
        });
      } else if (exerciseName.toLowerCase().includes("pullup") || exerciseName.toLowerCase().includes("row")) {
        prompts.push({
          type: "specific",
          message: "Working on back again?",
          exercise: exerciseName,
        });
      } else {
        prompts.push({
          type: "specific",
          message: `Time for ${exerciseName} again?`,
          exercise: exerciseName,
        });
      }
    }
  } else {
    // If no exercises on this day last week, suggest starting
    prompts.push({
      type: "general",
      message: "Ready to start your week strong?",
    });
  }

  // Add a random motivational prompt if no specific patterns
  if (prompts.length === 0) {
    const generalPrompts = [
      "Ready to crush it today?",
      "Time to get moving!",
      "Ready for a new PR?",
      "Let's make today count!",
    ];
    prompts.push({
      type: "general",
      message: generalPrompts[Math.floor(Math.random() * generalPrompts.length)],
    });
  }

  return Response.json({
    prompts: prompts.slice(0, 3), // Max 3 prompts
    currentDayOfWeek,
  });
}
