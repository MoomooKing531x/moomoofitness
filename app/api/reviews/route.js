import { getUserIdFromCookies } from "../../../lib/auth";
import { prisma } from "../../../lib/db";

// Get all reviews with optional sorting
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "latest"; // latest, oldest, highest-rated, lowest-rated

    let orderBy;
    switch (sortBy) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "highest-rated":
        orderBy = { rating: "desc" };
        break;
      case "lowest-rated":
        orderBy = { rating: "asc" };
        break;
      case "latest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const reviews = await prisma.review.findMany({
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return Response.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new review
export async function POST(request) {
  try {
    const userId = getUserIdFromCookies();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rating, title, description } = await request.json();

    // Validation
    if (!rating || !title || !description) {
      return Response.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return Response.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (title.length < 1 || title.length > 100) {
      return Response.json(
        { error: "Title must be 1-100 characters" },
        { status: 400 }
      );
    }

    if (description.length < 1 || description.length > 500) {
      return Response.json(
        { error: "Description must be 1-500 characters" },
        { status: 400 }
      );
    }

    // Check for 3-day cooldown
    const threeAgoDate = new Date();
    threeAgoDate.setDate(threeAgoDate.getDate() - 3);

    const lastReview = await prisma.review.findFirst({
      where: {
        authorId: userId,
        createdAt: {
          gte: threeAgoDate,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (lastReview) {
      const nextReviewDate = new Date(lastReview.createdAt);
      nextReviewDate.setDate(nextReviewDate.getDate() + 3);
      return Response.json(
        {
          error: `You can post another review on ${nextReviewDate.toDateString()}`,
          nextReviewDate: nextReviewDate.toISOString(),
        },
        { status: 429 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        authorId: userId,
        rating,
        title,
        description: description.slice(0, 500), // Ensure truncation
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return Response.json({ ok: true, review });
  } catch (error) {
    console.error("Error creating review:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
