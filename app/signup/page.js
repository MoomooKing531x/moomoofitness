"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: "Server error. Please try again." };
      }

      if (!res.ok) {
        setError(data.error || "Sign up failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Network error. Please check your connection.");
    }
  }

  return (
    <main className="max-w-sm mx-auto mt-24 px-6">
      <h1 className="text-2xl font-semibold mb-6 text-center">Sign up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="border border-gray-300 rounded-md px-3 py-2"
          placeholder="Username (3+ chars)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="border border-gray-300 rounded-md px-3 py-2"
          placeholder="Password (6+ chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="border border-gray-300 rounded-md px-3 py-2"
          placeholder="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="border border-gray-900 rounded-md py-2 font-medium hover:bg-gray-900 hover:text-white transition">
          Create account
        </button>
      </form>
      <p className="text-sm text-center mt-4 text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
