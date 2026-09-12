import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

// POST /api/challenge/difficulty { challengeId, difficulty }
export async function POST(request) {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Not logged in." }, { status: 401 });

  const { challengeId, difficulty } = await request.json();
  
  if (!challengeId) return Response.json({ error: "challengeId required." }, { status: 400 });
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    return Response.json({ error: "Invalid difficulty. Must be easy, medium, or hard." }, { status: 400 });
  }

  const completion = await prisma.challengeCompletion.findUnique({
    where: { userId_challengeId: { userId, challengeId } },
  });

  if (!completion) {
    return Response.json({ error: "Challenge not completed yet." }, { status: 400 });
  }

  // Update the completion with difficulty feedback
  await prisma.challengeCompletion.update({
    where: { userId_challengeId: { userId, challengeId } },
    data: { difficulty },
  });

  return Response.json({ ok: true });
}

