"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";

function StarRating({ rating, interactive = false, onChange = null }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && onChange?.(star)}
          className={`text-2xl transition ${
            star <= rating
              ? "text-yellow-400"
              : "text-gray-300"
          } ${interactive ? "cursor-pointer hover:text-yellow-300" : ""}`}
          disabled={!interactive}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [sortBy, setSortBy] = useState("latest");
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState(null);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Fetch user stats and reviews
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [userRes, reviewsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/reviews?sortBy=${sortBy}`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUserStats(userData.user);
        }

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sortBy]);

  async function handlePostReview(e) {
    e.preventDefault();
    if (!formRating || !formTitle || !formDescription) {
      setError("All fields are required");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          title: formTitle,
          description: formDescription,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReviews([data.review, ...reviews]);
        setFormRating(0);
        setFormTitle("");
        setFormDescription("");
        setError("");
        setNextReviewDate(null);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to post review");
        if (data.nextReviewDate) {
          setNextReviewDate(new Date(data.nextReviewDate));
        }
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setFormLoading(false);
    }
  }

  const wordCount = formDescription.split(/\s+/).filter(Boolean).length;

  return (
    <div>
      <Navbar
        username={userStats?.username || ""}
        displayName={userStats?.displayName || ""}
        currentStreak={0}
        points={0}
        elo={0}
      />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/dashboard" className="text-sm text-gray-500 underline mb-6 inline-block">
          ← Back to dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">Community Reviews</h1>
        <p className="text-gray-600 mb-10">Share your fitness journey and read what others think</p>

        {/* Review Form */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Leave a Review</h2>

          {nextReviewDate && (
            <div className="bg-yellow-100 border border-yellow-400 rounded px-4 py-3 mb-6 text-sm text-yellow-800">
              You can post your next review on <strong>{nextReviewDate.toDateString()}</strong>. You can leave 1 review every 3 days.
            </div>
          )}

          {error && !nextReviewDate && (
            <div className="bg-red-100 border border-red-400 rounded px-4 py-3 mb-6 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handlePostReview} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold mb-3">Rating</label>
              <StarRating
                rating={formRating}
                interactive={true}
                onChange={setFormRating}
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value.slice(0, 100))}
                placeholder="e.g., Great app for tracking progress!"
                maxLength="100"
                className="w-full border rounded px-4 py-2 text-sm"
                disabled={nextReviewDate !== null}
              />
              <p className="text-xs text-gray-500 mt-1">{formTitle.length}/100 characters</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value.slice(0, 500))}
                placeholder="Share your experience with MoomooFitness..."
                maxLength="500"
                rows="5"
                className="w-full border rounded px-4 py-2 text-sm"
                disabled={nextReviewDate !== null}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formDescription.length}/500 characters ({wordCount} words)
              </p>
            </div>

            <button
              type="submit"
              disabled={formLoading || nextReviewDate !== null || !formRating || !formTitle || !formDescription}
              className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {formLoading ? "Posting..." : "Post Review"}
            </button>
          </form>
        </div>

        {/* Reviews List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">All Reviews</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded px-4 py-2 text-sm"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest-rated">Highest Rated</option>
              <option value="lowest-rated">Lowest Rated</option>
            </select>
          </div>

          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to share!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white border rounded-lg p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{review.title}</h3>
                      <p className="text-sm text-gray-500">
                        By <strong>{review.author.displayName || review.author.username}</strong> •{" "}
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{review.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
