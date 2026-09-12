"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
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
        setError(data.error || "Login failed.");
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
      <h1 className="text-2xl font-semibold mb-6 text-center">Log in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="border border-gray-300 rounded-md px-3 py-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="border border-gray-300 rounded-md px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="border border-gray-900 rounded-md py-2 font-medium hover:bg-gray-900 hover:text-white transition">
          Log in
        </button>
      </form>
      <p className="text-sm text-center mt-4 text-gray-500">
        No account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
