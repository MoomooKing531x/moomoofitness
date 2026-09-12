"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function FriendsPanel() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/friends");
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResults(json.users || []);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function sendRequest(username) {
    setMessage("");
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const json = await res.json();
    setMessage(res.ok ? `Friend request sent to ${username}.` : json.error);
  }

  async function respond(friendshipId, accept) {
    await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, accept }),
    });
    load();
  }

  if (!data) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-2">Add a friend</h2>
        <input
          className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm"
          placeholder="Search by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <div className="border border-gray-200 rounded-md mt-2 divide-y">
            {results.map((u) => (
              <div key={u.id} className="flex justify-between items-center px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{u.username}</div>
                  <div className="text-xs text-gray-500">
                    <strong>ELO</strong> {(u.elo || 0).toLocaleString()} · Coins {u.coins || 0}
                  </div>
                </div>
                <button
                  onClick={() => sendRequest(u.username)}
                  className="text-xs border border-gray-900 rounded px-2 py-1 hover:bg-gray-900 hover:text-white"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
        {message && <p className="text-xs text-gray-500 mt-2">{message}</p>}
      </div>

      {data.incomingRequests?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Requests</h2>
          <div className="border border-gray-200 rounded-md divide-y">
            {data.incomingRequests.map((r) => (
              <div key={r.friendshipId} className="flex justify-between items-center px-3 py-2 text-sm">
                <span>{r.fromUsername}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(r.friendshipId, true)}
                    className="text-xs border border-gray-900 rounded px-2 py-1 hover:bg-gray-900 hover:text-white"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(r.friendshipId, false)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-500"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-2">Your friends</h2>
        <div className="border border-gray-200 rounded-md divide-y">
          {data.friends?.length === 0 && (
            <p className="p-3 text-sm text-gray-500">No friends yet — search above to add some.</p>
          )}
          {data.friends?.map((f) => (
            <Link
              key={f.id}
              href={`/profile/${f.username}`}
              className="block px-3 py-2 text-sm hover:bg-gray-50"
            >
              <div className="font-medium">{f.username}</div>
              <div className="text-xs text-gray-500">
                <strong>ELO</strong> {(f.elo || 0).toLocaleString()} · Coins {f.coins || 0}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
