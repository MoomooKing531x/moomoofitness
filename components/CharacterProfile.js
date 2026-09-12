"use client";
import Link from "next/link";

const ITEM_IMAGES = {
  // Hats
  "cap": "/hats/mmk cap.png",
  "sports-cap": "/hats/mmk sports cap.png",
  "kid-hat": "/hats/mmk kid hat.png",
  "cowboy-hat": "/hats/mmk cowboy hat.png",
  "helmet": "/hats/mmk helmet.png",
  "top-hat": "/hats/mmktop hat.png",
  // Jackets
  "jersey": "/jackets/mmk jersey.png",
  "tuxedo": "/jackets/mmk tuxedo.png",
  "leather-jacket": "/jackets/mmk leather jacket.png",
  "armor": "/jackets/mmk armor.png",
  "robe": "/jackets/mmk robe.png",
  // Accessories
  "gold-neck": "/accessories/gold neck.png",
  "sunglasses": "/accessories/mmk sunglasses.png",
};

const ITEM_NAMES = {
  // Hats
  "cap": "Cap",
  "sports-cap": "Sports Cap",
  "kid-hat": "Kid Hat",
  "cowboy-hat": "Cowboy Hat",
  "helmet": "Helmet",
  "top-hat": "Top Hat",
  // Jackets
  "jersey": "Jersey",
  "tuxedo": "Tuxedo",
  "leather-jacket": "Leather Jacket",
  "armor": "Armor",
  "robe": "Robe",
  // Accessories
  "gold-neck": "Gold Necklace",
  "sunglasses": "Sunglasses",
};

export default function CharacterProfile({ equippedHat, equippedJacket, equippedAccessory, profileGifUrl = "/profile.gif" }) {
  return (
    <div className="relative inline-block">
      {/* Base Profile GIF with Equipment Overlay */}
      <div className="relative w-64 h-80 bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-300">
        <img
          src={profileGifUrl}
          alt="Character"
          className="w-full h-full object-cover"
        />
        
        {/* Hat Overlay - on head */}
        {equippedHat && ITEM_IMAGES[equippedHat] && (
          <img
            src={ITEM_IMAGES[equippedHat]}
            alt="Hat"
            className="absolute left-1/2 transform -translate-x-1/2 object-contain pointer-events-none"
            style={{
              height: equippedHat === "helmet" ? "70.8px" : "224px", // h-56 = 224px, 1.3x bigger = 291px
              top: equippedHat === "helmet" ? "10px" : equippedHat === "top-hat" ? "-30px" : "-10px",
            }}
          />
        )}
        
        {/* Jacket Overlay - on body, 2x bigger */}
        {equippedJacket && ITEM_IMAGES[equippedJacket] && (
          <img
            src={ITEM_IMAGES[equippedJacket]}
            alt="Jacket"
            className="absolute left-1/2 transform -translate-x-1/2 h-80 object-contain pointer-events-none"
            style={{ top: "180px" }}
          />
        )}
        
        {/* Accessory Overlay - sunglasses on eyes, necklace on chest */}
        {equippedAccessory && ITEM_IMAGES[equippedAccessory] && (
          <img
            src={ITEM_IMAGES[equippedAccessory]}
            alt="Accessory"
            className="absolute left-1/2 transform -translate-x-1/2 h-32 object-contain pointer-events-none"
            style={{ top: "130px" }}
          />
        )}
      </div>

      {/* Equipment Display */}
      <div className="mt-4 text-sm space-y-2">
        {equippedHat && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-200">
            <span className="font-semibold text-blue-900 text-lg">👒</span>
            <span className="text-blue-900">{ITEM_NAMES[equippedHat] || equippedHat}</span>
          </div>
        )}
        {equippedJacket && (
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded border border-purple-200">
            <span className="font-semibold text-purple-900 text-lg">👗</span>
            <span className="text-purple-900">{ITEM_NAMES[equippedJacket] || equippedJacket}</span>
          </div>
        )}
        {equippedAccessory && (
          <div className="flex items-center gap-2 p-3 bg-pink-50 rounded border border-pink-200">
            <span className="font-semibold text-pink-900 text-lg">⌚</span>
            <span className="text-pink-900">{ITEM_NAMES[equippedAccessory] || equippedAccessory}</span>
          </div>
        )}
        {!equippedHat && !equippedJacket && !equippedAccessory && (
          <div className="text-gray-500 text-xs text-center py-4 px-2 bg-gray-50 rounded">
            No items equipped yet
          </div>
        )}
        <Link 
          href="/shop"
          className="block text-center text-sm text-blue-600 hover:text-blue-700 underline hover:font-semibold transition font-medium"
        >
          Customize in Locker →
        </Link>
      </div>
    </div>
  );
}
