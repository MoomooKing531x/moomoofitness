import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// POST /api/challenge/shuffle { challengeId }
// Generates a new random daily challenge, replacing the current one
export async function POST(request) {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Not logged in." }, { status: 401 });

  const { challengeId } = await request.json();
  if (!challengeId) return Response.json({ error: "challengeId required." }, { status: 400 });

  // Verify the challenge exists and belongs to today
  const challenge = await prisma.dailyChallenge.findUnique({
    where: { id: challengeId },
  });
  if (!challenge || challenge.userId !== userId) {
    return Response.json({ error: "Challenge not found." }, { status: 404 });
  }

  // Delete the current challenge
  await prisma.dailyChallenge.delete({ where: { id: challengeId } });

  // Get all public exercises
  const exercises = await prisma.exercise.findMany({
    where: { isPublic: true },
  });

  if (!exercises.length) {
    return Response.json({ error: "No exercises available." }, { status: 500 });
  }

  // Pick a random exercise
  const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];

  // Generate random target amount based on exercise unit
  let targetAmount;
  if (randomExercise.unit === "seconds") {
    targetAmount = Math.floor(Math.random() * 60) + 20; // 20-80 seconds
  } else if (randomExercise.unit === "km") {
    targetAmount = Math.floor(Math.random() * 5) + 1; // 1-5 km
  } else {
    targetAmount = Math.floor(Math.random() * 30) + 10; // 10-40 reps
  }

  // Create new challenge for today
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const newChallenge = await prisma.dailyChallenge.create({
    data: {
      userId,
      date: today,
      exerciseId: randomExercise.id,
      targetAmount,
      isTrySomethingNew: false,
    },
    include: { exercise: true },
  });

  return Response.json({
    ok: true,
    challenge: {
      id: newChallenge.id,
      exerciseName: newChallenge.exercise.name,
      targetAmount: newChallenge.targetAmount,
      unit: newChallenge.exercise.unit,
      isTrySomethingNew: newChallenge.isTrySomethingNew,
    },
  });
}
