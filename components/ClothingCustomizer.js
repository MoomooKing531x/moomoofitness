"use client";
import { useState, useEffect } from "react";
import AvatarPreview from "./AvatarPreview";

const SHOP_ITEMS = {
  hats: [
    { id: "cap", name: "Cap", cost: 500, filename: "mmk cap.png" },
    { id: "sports-cap", name: "Sports Cap", cost: 1000, filename: "mmk sports cap.png" },
    { id: "kid-hat", name: "Kid Hat", cost: 2000, filename: "mmk kid hat.png" },
    { id: "cowboy-hat", name: "Cowboy Hat", cost: 3000, filename: "mmk cowboy hat.png" },
    { id: "helmet", name: "Helmet", cost: 7000, filename: "mmk helmet.png" },
    { id: "top-hat", name: "Top Hat", cost: 10000, filename: "mmktop hat.png" },
  ],
  jackets: [
    { id: "jersey", name: "Jersey", cost: 1500, filename: "mmk jersey.png" },
    { id: "tuxedo", name: "Tuxedo", cost: 4500, filename: "mmk tuxeto.png" },
    { id: "leather-jacket", name: "Leather Jacket", cost: 5000, filename: "mmk leather jacket.png" },
    { id: "armor", name: "Armor", cost: 9000, filename: "mmk armor.png" },
    { id: "robe", name: "Robe", cost: 15000, filename: "mmk robe.png" },
  ],
  accessories: [
    { id: "gold-neck", name: "Gold Neck", cost: 4500, filename: "gold neck.png" },
    { id: "sunglasses", name: "Sunglasses", cost: 6000, filename: "mmk sunglasses.png" },
  ],
};

export default function ClothingCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Hats");
  const [ownedItems, setOwnedItems] = useState(new Set());
  const [equippedItems, setEquippedItems] = useState({});
  const [previewItem, setPreviewItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const categories = ["Hats", "Jackets", "Accessories"];

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
    }

    // Listen for shop updates
    const handleOwnedItemsUpdated = (event) => {
      console.log("Locker - Received owned items update:", event.detail.ownedItems); // Debug log
      setOwnedItems(new Set(event.detail.ownedItems || []));
    };

    window.addEventListener('ownedItemsUpdated', handleOwnedItemsUpdated);

    return () => {
      window.removeEventListener('ownedItemsUpdated', handleOwnedItemsUpdated);
    };
  }, [isOpen]);

  const fetchUserData = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      console.log("Locker - Auth response status:", meRes.status); // Debug log
      if (meRes.ok) {
        const meData = await meRes.json();
        console.log("Locker - Auth response data:", meData); // Debug log

        let items = [];
        try {
          items = JSON.parse(meData.user.ownedItems || "[]");
          console.log("Locker - Owned items from DB:", items); // Debug log
          console.log("Locker - Looking for item IDs:", SHOP_ITEMS.hats.map(h => h.id)); // Debug log
        } catch {
          items = [];
        }
        setOwnedItems(new Set(items));

        setEquippedItems({
          hats: meData.user.equippedHat,
          jackets: meData.user.equippedJacket,
          accessories: meData.user.equippedAccessory,
        });
      } else {
        console.error("Locker - Auth failed with status:", meRes.status);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryKey = (category) => {
    return category.toLowerCase();
  };

  const getFilteredItems = () => {
    const categoryKey = getCategoryKey(activeCategory);
    const items = SHOP_ITEMS[categoryKey] || [];
    
    if (!searchQuery) return items;
    
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleEquip = async (itemId) => {
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/shop/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setEquippedItems({
            hats: data.equippedHat,
            jackets: data.equippedJacket,
            accessories: data.equippedAccessory,
          });
          // Refresh user data to ensure persistence
          await fetchUserData();
          setMessage({ type: "success", text: "✅ Equipped!" });
          setTimeout(() => setMessage({ type: "", text: "" }), 2000);
        } else {
          setMessage({ type: "error", text: `❌ ${data.error || 'Equip failed'}` });
        }
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: `❌ ${error.error}` });
      }
    } catch (error) {
      console.error("Error equipping item:", error);
      setMessage({ type: "error", text: "❌ Equip failed" });
    }
  };

  const handlePreviewItem = (item) => {
    setPreviewItem(item);
  };

  const handleClearPreview = () => {
    setPreviewItem(null);
  };

  const filteredItems = getFilteredItems();

  return (
    <>
      {/* Clothing Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-600 hover:text-gray-900 transition"
        title="Customize"
      >
        {/* Clothing/T-shirt SVG Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 4V2m12 2v2M6 4h12M6 4l-2 5v9a2 2 0 002 2h12a2 2 0 002-2v-9l-2-5M6 4h12"
          />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Customize Your Look</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Message Display */}
              {message.text && (
                <div className={`mb-4 px-4 py-2 rounded-lg ${
                  message.type === "error" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"
                }`}>
                  {message.text}
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={fetchUserData}
                className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm"
              >
                Refresh Items
              </button>

              {/* Avatar Preview with Equipment */}
              <div className="mb-8 flex justify-center">
                <div className="relative w-full max-w-sm">
                  <AvatarPreview
                    equippedHat={previewItem && getCategoryKey(activeCategory) === 'hats' ? previewItem.id : equippedItems.hats}
                    equippedJacket={previewItem && getCategoryKey(activeCategory) === 'jackets' ? previewItem.id : equippedItems.jackets}
                    equippedAccessory={previewItem && getCategoryKey(activeCategory) === 'accessories' ? previewItem.id : equippedItems.accessories}
                    previewItem={previewItem}
                    previewCategory={getCategoryKey(activeCategory)}
                  />
                  {previewItem && (
                    <button
                      onClick={handleClearPreview}
                      className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                      Clear Preview
                    </button>
                  )}
                </div>
              </div>

              {/* Category Tabs */}
              <div className="mb-6 flex gap-3 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      setSearchQuery("");
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      activeCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder={`Search ${activeCategory.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-3 gap-4">
                {loading ? (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    <p>Loading...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    <p>No {activeCategory.toLowerCase()} available</p>
                    <p className="text-sm mt-1">Visit the shop to purchase items!</p>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isOwned = ownedItems.has(item.id);
                    const isEquipped = equippedItems[getCategoryKey(activeCategory)] === item.id;
                    const isPreviewed = previewItem?.id === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 border rounded-lg hover:shadow-md transition cursor-pointer ${
                          isEquipped ? "border-green-500 bg-green-50" : isPreviewed ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                        onClick={() => isOwned && handlePreviewItem(item)}
                      >
                        <div className="bg-gray-100 h-24 rounded mb-2 flex items-center justify-center overflow-hidden">
                          {isOwned ? (
                            <img
                              src={`/${getCategoryKey(activeCategory)}/${item.filename}`}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">Not owned</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400">ID: {item.id}</p>
                        {isOwned ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquip(item.id);
                            }}
                            disabled={isEquipped}
                            className={`mt-2 w-full py-1 rounded text-xs font-semibold ${
                              isEquipped
                                ? "bg-green-600 text-white cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {isEquipped ? "✓ Equipped" : "Equip"}
                          </button>
                        ) : (
                          <p className="text-xs text-gray-500 mt-2">Visit shop to buy</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
