"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import CoinIcon from "../../components/CoinIcon";
import AvatarPreview from "../../components/AvatarPreview";

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

const WELCOME_MESSAGES = [
  "Welcome to the Locker!",
  "Ready to customize?",
  "Show off your style!",
  "Treat yourself today!",
  "Level up your look!",
  "Let's find your perfect fit!",
  "Express yourself here!",
  "Your wardrobe awaits!",
  "Time to shine!",
  "Become who you want to be!",
];

export default function ShopPage() {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("hats");
  const [ownedItems, setOwnedItems] = useState(new Set());
  const [equippedItems, setEquippedItems] = useState({});
  const [previewItem, setPreviewItem] = useState(null);
  const [message, setMessage] = useState("");
  const [purchasing, setPurchasing] = useState(null);
  const [friends, setFriends] = useState([]);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [giftMessage, setGiftMessage] = useState("");
  const [sendingGift, setSendingGift] = useState(false);
  const [shopMessage, setShopMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setMessage(WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]);
    fetchUserStats();
  }, []);

  // Listen for coin updates from game wins or purchases
  useEffect(() => {
    const handleCoinsUpdated = (event) => {
      setUserStats(prev => prev ? { ...prev, coins: event.detail.coins } : null);
    };
    
    window.addEventListener('coinsUpdated', handleCoinsUpdated);
    return () => window.removeEventListener('coinsUpdated', handleCoinsUpdated);
  }, []);

  async function fetchUserStats() {
    try {
      // Fetch both auth data and game data
      const [meRes, gameRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/game/me")
      ]);

      if (meRes.ok && gameRes.ok) {
        const meData = await meRes.json();
        const gameData = await gameRes.json();

        // Combine auth data with game data (coins)
        setUserStats({
          ...meData.user,
          coins: gameData.coins || 0,
          elo: gameData.elo || 0
        });

        let items = [];
        try {
          items = JSON.parse(meData.user.ownedItems || "[]");
        } catch {
          items = [];
        }
        setOwnedItems(new Set(items));

        setEquippedItems({
          hats: meData.user.equippedHat,
          jackets: meData.user.equippedJacket,
          accessories: meData.user.equippedAccessory,
        });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFriends() {
    try {
      const res = await fetch("/api/friends/list");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  }

  async function handlePurchase(itemId, cost, itemName) {
    if (!userStats) return;
    if (userStats.coins < cost) {
      setShopMessage({ type: "error", text: `Not enough coins! Need ${cost}, you have ${userStats.coins}` });
      return;
    }

    setPurchasing(itemId);
    setShopMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, cost }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Purchase response:", data); // Debug log

        if (data.ok) {
          // Update owned items immediately from response
          console.log("Setting owned items to:", data.ownedItems); // Debug log
          setOwnedItems(new Set(data.ownedItems || []));

          // Broadcast to locker that items were updated
          window.dispatchEvent(new CustomEvent('ownedItemsUpdated', { detail: { ownedItems: data.ownedItems || [] } }));

          // Refresh user stats to get latest data from database
          await fetchUserStats();

          // Broadcast coin update to navbar by triggering window event
          window.dispatchEvent(new CustomEvent('coinsUpdated', { detail: { coins: data.coins } }));

          setShopMessage({ type: "success", text: `✅ Purchased ${itemName}!` });
        } else if (data.error === "Item already owned") {
          // If item is already owned, just refresh the UI to show it as owned
          await fetchUserStats();
          setShopMessage({ type: "success", text: `✅ ${itemName} is already in your locker!` });
        } else {
          setShopMessage({ type: "error", text: `❌ ${data.error || 'Purchase failed'}` });
        }
      } else {
        const error = await res.json();
        console.log("Purchase error:", error); // Debug log
        if (error.error === "Item already owned") {
          // If item is already owned, just refresh the UI to show it as owned
          await fetchUserStats();
          setShopMessage({ type: "success", text: `✅ ${itemName} is already in your locker!` });
        } else {
          setShopMessage({ type: "error", text: `❌ ${error.error}` });
        }
      }
    } catch (error) {
      console.error("Error purchasing item:", error);
      setShopMessage({ type: "error", text: "❌ Purchase failed" });
    } finally {
      setPurchasing(null);
    }
  }

  async function handleEquip(itemId, category) {
    setShopMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/shop/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          // Refresh user stats to ensure persistence
          await fetchUserStats();
          setShopMessage({ type: "success", text: "✅ Equipped!" });
        } else {
          setShopMessage({ type: "error", text: `❌ ${data.error || 'Equip failed'}` });
        }
      } else {
        const error = await res.json();
        setShopMessage({ type: "error", text: `❌ ${error.error}` });
      }
    } catch (error) {
      console.error("Error equipping item:", error);
      setShopMessage({ type: "error", text: "❌ Equip failed" });
    }
  }

  async function handleGiftItem() {
    if (!previewItem || !selectedFriend) {
      alert("Select an item and friend");
      return;
    }

    setSendingGift(true);
    try {
      const res = await fetch("/api/shop/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: previewItem.id,
          recipientId: selectedFriend.id,
          message: giftMessage || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserStats({ ...userStats, coins: data.coins });
        
        // Broadcast coin update to navbar
        window.dispatchEvent(new CustomEvent('coinsUpdated', { detail: { coins: data.coins } }));
        
        alert(`✅ Gift sent to ${selectedFriend.displayName || selectedFriend.username}!`);
        setShowGiftModal(false);
        setSelectedFriend(null);
        setGiftMessage("");
      } else {
        const error = await res.json();
        alert(`❌ ${error.error}`);
      }
    } catch (error) {
      console.error("Error sending gift:", error);
      alert("❌ Gift failed");
    } finally {
      setSendingGift(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar
          username={userStats?.username || ""}
          displayName={userStats?.displayName || ""}
          currentStreak={0}
          elo={userStats?.elo || 0}
          coins={userStats?.coins || 0}
        />
        <main className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-center text-gray-500">Loading shop...</p>
        </main>
      </div>
    );
  }

  const currentItems = SHOP_ITEMS[selectedCategory] || [];

  return (
    <div>
      <Navbar
        username={userStats?.username || ""}
        displayName={userStats?.displayName || ""}
        currentStreak={0}
        elo={userStats?.elo || 0}
        coins={userStats?.coins || 0}
      />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{message}</h1>
            <p className="text-gray-600">Buy items for yourself or gift them to friends!</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchUserStats}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm"
            >
              Refresh
            </button>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
              <CoinIcon size={24} className="text-yellow-600" />
              <div>
                <p className="text-xs text-gray-600">Your Coins</p>
                <p className="text-2xl font-bold text-yellow-600">{userStats?.coins || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shop Messages */}
        {shopMessage.text && (
          <div className={`mb-4 px-4 py-2 rounded-lg ${
            shopMessage.type === "error" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"
          }`}>
            {shopMessage.text}
          </div>
        )}

        {/* Main Layout: Shop + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left: Shop Items */}
          <div className="lg:col-span-2">
            {/* Category Tabs */}
            <div className="flex gap-4 mb-8 border-b">
              {["hats", "jackets", "accessories"].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 font-semibold text-sm border-b-2 transition capitalize ${
                    selectedCategory === category
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentItems.map((item) => {
                const isOwned = ownedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg overflow-hidden transition cursor-pointer ${
                      previewItem?.id === item.id
                        ? "ring-2 ring-blue-500 shadow-lg"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setPreviewItem(item)}
                  >
                    {/* Item Image */}
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-32 flex items-center justify-center text-4xl overflow-hidden">
                      {selectedCategory === "hats" && item && (
                        <img src={`/hats/${item.filename}`} alt={item.name} className="h-full object-contain" />
                      )}
                      {selectedCategory === "jackets" && item && (
                        <img src={`/jackets/${item.filename}`} alt={item.name} className="h-full object-contain" />
                      )}
                      {selectedCategory === "accessories" && item && (
                        <img src={`/accessories/${item.filename}`} alt={item.name} className="h-full object-contain" />
                      )}
                      {!item && (
                        <p className="text-gray-400">Select an item</p>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                      <p className="text-xs text-gray-400">ID: {item.id}</p>

                      {!isOwned && (
                        <div className="flex items-center gap-2 mb-3 text-lg font-bold">
                          <CoinIcon size={20} className="text-yellow-600" />
                          <span className="text-yellow-600">{item.cost}</span>
                        </div>
                      )}

                      {!isOwned ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(item.id, item.cost, item.name);
                          }}
                          disabled={purchasing === item.id || (userStats?.coins || 0) < item.cost}
                          className={`w-full py-2 rounded-md font-semibold text-sm transition ${
                            (userStats?.coins || 0) < item.cost
                              ? "bg-red-100 text-red-600 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {purchasing === item.id ? "Purchasing..." : "Buy"}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2 rounded-md font-semibold text-sm bg-green-600 text-white cursor-not-allowed"
                        >
                          Purchased!
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Preview Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white border rounded-lg p-6 shadow-lg space-y-4">
              <h2 className="text-xl font-bold">Preview</h2>

              {previewItem ? (
                <div className="space-y-4">
                  {/* Avatar Preview */}
                  <AvatarPreview
                    equippedHat={equippedItems.hats}
                    equippedJacket={equippedItems.jackets}
                    equippedAccessory={equippedItems.accessories}
                    previewItem={previewItem}
                    previewCategory={selectedCategory}
                  />

                  {/* Item Details */}
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Item</p>
                      <p className="text-lg font-bold text-gray-900">{previewItem.name}</p>
                    </div>

                    {!ownedItems.has(previewItem.id) && (
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">Price</p>
                        <div className="flex items-center gap-2">
                          <CoinIcon size={20} className="text-yellow-600" />
                          <p className="text-2xl font-bold text-yellow-600">{previewItem.cost}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-2">
                      {!ownedItems.has(previewItem.id) ? (
                        <>
                          <button
                            onClick={() => handlePurchase(previewItem.id, previewItem.cost, previewItem.name)}
                            disabled={purchasing === previewItem.id || (userStats?.coins || 0) < previewItem.cost}
                            className={`w-full py-3 rounded-md font-bold transition ${
                              (userStats?.coins || 0) < previewItem.cost
                                ? "bg-red-100 text-red-600 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {purchasing === previewItem.id ? "Purchasing..." : "Buy for Me"}
                          </button>
                          <button
                            onClick={() => {
                              fetchFriends();
                              setShowGiftModal(true);
                            }}
                            className="w-full py-3 rounded-md font-bold bg-purple-600 text-white hover:bg-purple-700 transition"
                          >
                            Buy for Friend
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEquip(previewItem.id, selectedCategory)}
                          className={`w-full py-3 rounded-md font-bold transition ${
                            equippedItems[selectedCategory] === previewItem.id
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                          }`}
                        >
                          {equippedItems[selectedCategory] === previewItem.id ? "✓ Equipped" : "Equip"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Click an item to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gift Modal */}
        {showGiftModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Send as Gift</h2>

              <p className="text-sm text-gray-600 mb-4">
                Choose a friend to send {previewItem?.name} to:
              </p>

              {/* Friends List */}
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {friends.length === 0 ? (
                  <p className="text-gray-500 text-sm">You have no friends yet.</p>
                ) : (
                  friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => setSelectedFriend(friend)}
                      className={`w-full p-3 rounded text-left transition ${
                        selectedFriend?.id === friend.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <p className="font-semibold">{friend.displayName || friend.username}</p>
                      <p className="text-xs opacity-75">@{friend.username}</p>
                    </button>
                  ))
                )}
              </div>

              {/* Optional Message */}
              <textarea
                placeholder="Add a message (optional)"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                maxLength={200}
                className="w-full p-3 border rounded mb-4 text-sm resize-none"
                rows="3"
              />

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowGiftModal(false);
                    setSelectedFriend(null);
                    setGiftMessage("");
                  }}
                  className="flex-1 py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGiftItem}
                  disabled={!selectedFriend || sendingGift}
                  className="flex-1 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 font-semibold disabled:opacity-50"
                >
                  {sendingGift ? "Sending..." : "Send Gift"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
