import { prisma } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function POST(request) {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { displayName, age, gender } = await request.json();

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: displayName || null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
