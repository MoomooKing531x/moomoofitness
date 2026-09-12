"use client";

import { useState } from "react";
import PasswordResetForm from "./PasswordResetForm";

export default function PasswordResetModal({ userId }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-blue-500 underline"
      >
        Change Password
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Change Password</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <PasswordResetForm userId={userId} />
          </div>
        </div>
      )}
    </>
  );
}
