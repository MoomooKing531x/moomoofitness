import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function GET() {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Get all troop types
  const troopTypes = await prisma.troopType.findMany({
    include: {
      exercise: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
  });

  return Response.json({ troopTypes });
}

export async function POST(request) {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { troopTypeId, quantity, actualCost } = await request.json();
  const parsedQuantity = Number(quantity);

  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return Response.json({ error: "Quantity must be a positive number." }, { status: 400 });
  }

  // Get troop type
  const troopType = await prisma.troopType.findUnique({
    where: { id: troopTypeId },
  });

  if (!troopType) {
    return Response.json({ error: "Troop type not found." }, { status: 404 });
  }

  // Use the actual cost passed from client (includes difficulty and level scaling)
  const totalCost = actualCost || (troopType.cost * parsedQuantity);

  // Check user's GP balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { gp: true },
  });

  if (!user || user.gp < totalCost) {
    return Response.json({ error: "Insufficient game points (GP)." }, { status: 400 });
  }

  // Deduct GP (game points used for purchasing troops)
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { gp: { decrement: totalCost } },
    select: { gp: true },
  });

  return Response.json({
    ok: true,
    remainingPoints: updatedUser.gp,
    troopsPurchased: parsedQuantity,
  });
}

