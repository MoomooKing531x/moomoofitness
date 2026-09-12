"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function GiftPopup({ gift, onClose }) {
  const [stage, setStage] = useState("shake"); // shake -> explode -> reveal -> done
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Shake for 1.5 seconds
    const shakeTimer = setTimeout(() => {
      setStage("explode");
    }, 1500);

    return () => clearTimeout(shakeTimer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="relative">
        {/* Shaking Gift Box */}
        {stage === "shake" && (
          <div className="animate-bounce text-9xl">
            🎁
          </div>
        )}

        {/* Exploding Animation */}
        {stage === "explode" && (
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Confetti particles */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-ping"
                style={{
                  width: "12px",
                  height: "12px",
                  background: ["🎉", "✨", "🎊", "⭐"][i % 4],
                  fontSize: "24px",
                  animation: `explode ${0.8}s ease-out forwards`,
                  animationDelay: `${i * 0.05}s`,
                  "--tx": `${Math.cos((i / 12) * Math.PI * 2) * 200}px`,
                  "--ty": `${Math.sin((i / 12) * Math.PI * 2) * 200}px`,
                }}
              >
                {["🎉", "✨", "🎊", "⭐"][i % 4]}
              </div>
            ))}
            <div className="text-7xl animate-pulse">💥</div>
          </div>
        )}

        {/* Gift Reveal */}
        {stage === "explode" && (
          <div
            className="mt-8 bg-white rounded-lg p-8 shadow-2xl max-w-md text-center animate-fadeIn"
            onAnimationEnd={() => setStage("reveal")}
          >
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">You Received a Gift!</h2>
            <p className="text-gray-600 mb-1">From <strong>{gift.senderName}</strong></p>
            
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6 my-6 border-2 border-purple-300">
              <p className="text-sm text-gray-600 mb-2">Item:</p>
              <p className="text-3xl font-bold text-purple-600">{gift.itemName}</p>
            </div>

            {gift.message && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <p className="text-sm text-gray-600 italic">"{gift.message}"</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Later
              </button>
              <Link
                href="/shop"
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-center"
                onClick={onClose}
              >
                Go to Locker
              </Link>
            </div>
          </div>
        )}

        {stage === "reveal" && (
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">You Received a Gift!</h2>
            <p className="text-gray-600 mb-1">From <strong>{gift.senderName}</strong></p>
            
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6 my-6 border-2 border-purple-300">
              <p className="text-sm text-gray-600 mb-2">Item:</p>
              <p className="text-3xl font-bold text-purple-600">{gift.itemName}</p>
            </div>

            {gift.message && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <p className="text-sm text-gray-600 italic">"{gift.message}"</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Later
              </button>
              <Link
                href="/shop"
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-center"
                onClick={onClose}
              >
                Go to Locker
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes explode {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
