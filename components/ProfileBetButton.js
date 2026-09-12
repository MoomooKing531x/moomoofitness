"use client";
import { useState } from "react";
import BetModal from "./BetModal";

export default function ProfileBetButton({ friendId, friendName, userCoins }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full px-4 py-2 rounded-md border border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold text-sm transition"
      >
        Challenge with Bet
      </button>

      {showModal && (
        <BetModal
          friendId={friendId}
          friendName={friendName}
          userCoins={userCoins}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
