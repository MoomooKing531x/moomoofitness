import { getUserIdFromCookies } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export async function POST(request) {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { age, gender, displayName } = await request.json();

    // Validate inputs
    if (!age || !gender || !displayName) {
      return Response.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (age < 1 || age > 150 || !Number.isInteger(age)) {
      return Response.json(
        { error: "Invalid age" },
        { status: 400 }
      );
    }

    if (!["male", "female", "prefer not to say"].includes(gender.toLowerCase())) {
      return Response.json(
        { error: "Invalid gender" },
        { status: 400 }
      );
    }

    if (displayName.length < 1 || displayName.length > 30) {
      return Response.json(
        { error: "Display name must be 1-30 characters" },
        { status: 400 }
      );
    }

    // Update user with onboarding data
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        age,
        gender: gender.toLowerCase(),
        displayName,
        onboardingCompleted: true,
      },
    });

    return Response.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/auth/onboarding:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
