"use client";

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
  "tuxedo": "/jackets/mmk tuxeto.png",
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

export default function AvatarPreview({ equippedHat, equippedJacket, equippedAccessory, previewItem, previewCategory }) {
  // Determine what to display
  const hat = previewItem && previewCategory === "hats" ? previewItem.id : equippedHat;
  const jacket = previewItem && previewCategory === "jackets" ? previewItem.id : equippedJacket;
  const accessory = previewItem && previewCategory === "accessories" ? previewItem.id : equippedAccessory;

  const hatImage = hat ? ITEM_IMAGES[hat] : null;
  const jacketImage = jacket ? ITEM_IMAGES[jacket] : null;
  const accessoryImage = accessory ? ITEM_IMAGES[accessory] : null;

  return (
    <div className="relative w-full">
      {/* Character with Equipment Overlay */}
      <div className="relative w-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-lg border-2 border-blue-300 shadow-lg overflow-hidden">
        {/* Base Character Image */}
        <img
          src="/profile.gif"
          alt="Character"
          className="w-full h-auto"
        />

        {/* Hat Overlay - on head */}
        {hatImage && (
          <img
            src={hatImage}
            alt="Hat"
            className="absolute left-1/2 transform -translate-x-1/2 object-contain pointer-events-none"
            style={{
              height: hat === "helmet" ? "354px" : "224px", // helmet 5x bigger (70.8px * 5 = 354px)
              top: hat === "helmet" ? "-20px" : hat === "top-hat" ? "-55px" : "-35px", // all hats 15px higher except helmet
            }}
          />
        )}

        {/* Jacket Overlay - on body, 1.2x bigger */}
        {jacketImage && (
          <img
            src={jacketImage}
            alt="Jacket"
            className="absolute left-1/2 transform -translate-x-1/2 object-contain pointer-events-none"
            style={{
              height: "384px", // h-80 = 320px, 1.2x = 384px
              top: jacket === "tuxedo" ? "45px" : (jacket === "armor" || jacket === "leather-jacket") ? "125px" : "135px" // tuxedo 90px higher, armor/leather 10px higher
            }}
          />
        )}

        {/* Accessory Overlay - sunglasses on eyes, necklace on neck */}
        {accessoryImage && (
          <img
            src={accessoryImage}
            alt="Accessory"
            className="absolute left-1/2 transform -translate-x-1/2 object-contain pointer-events-none"
            style={{
              height: accessory === "sunglasses" ? "192px" : "153.6px", // sunglasses 1.5x bigger (128px * 1.5 = 192px), necklace 1.6x bigger (96px * 1.6 = 153.6px)
              top: accessory === "sunglasses" ? "100px" : "190px", // sunglasses 10px higher (110px - 10px = 100px), necklace 20px lower (170px + 20px = 190px)
            }}
          />
        )}
      </div>

      {/* Equipped Items List */}
      <div className="mt-4 space-y-2 text-sm">
        {hatImage && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
            <span className="text-lg font-semibold">👒</span>
            <span className="text-gray-700">{ITEM_NAMES[hat]}</span>
          </div>
        )}
        {jacketImage && (
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded border border-purple-200">
            <span className="text-lg font-semibold">👗</span>
            <span className="text-gray-700">{ITEM_NAMES[jacket]}</span>
          </div>
        )}
        {accessoryImage && (
          <div className="flex items-center gap-2 p-2 bg-pink-50 rounded border border-pink-200">
            <span className="text-lg font-semibold">⌚</span>
            <span className="text-gray-700">{ITEM_NAMES[accessory]}</span>
          </div>
        )}
        {!hatImage && !jacketImage && !accessoryImage && (
          <p className="text-gray-500 text-xs text-center py-4">No items equipped</p>
        )}
      </div>
    </div>
  );
}
