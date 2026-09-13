"use client";

import { useState } from "react";

export default function EditAccountModal({ isOpen, onClose, onSave, currentData }) {
  const [displayName, setDisplayName] = useState(currentData.displayName || "");
  const [age, setAge] = useState(currentData.age || "");
  const [gender, setGender] = useState(currentData.gender || "");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ displayName, age: age ? parseInt(age) : null, gender });
  };

  const handleSkip = () => {
    onSave({ displayName, age: null, gender: "" });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Edit Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name (what to call you)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your display name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your age"
              min="1"
              max="120"
            />
            <p className="text-xs text-orange-600 mt-1">⚠️ Any player can see this information</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <p className="text-xs text-orange-600 mt-1">⚠️ Any player can see this information</p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
            >
              Skip Age/Gender
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
