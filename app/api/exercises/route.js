import { prisma } from "../../../lib/db.js";

export const dynamic = 'force-dynamic';

export async function GET() {
  const exercises = await prisma.exercise.findMany({
    where: { isPublic: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return Response.json({ exercises });
}

