"use client";
import { useState, useEffect } from "react";
import GiftPopup from "./GiftPopup";

export default function DashboardClient({ children }) {
  const [giftToShow, setGiftToShow] = useState(null);
  const [shownGiftIds, setShownGiftIds] = useState(new Set());

  useEffect(() => {
    // Check for unclaimed gifts on mount and every 5 seconds
    const checkGifts = async () => {
      try {
        const res = await fetch("/api/shop/gifts");
        if (res.ok) {
          const data = await res.json();
          
          // Find the first unclaimed gift we haven't shown yet
          const unclaimedGifts = data.gifts.filter(g => !g.claimedAt);
          
          for (const gift of unclaimedGifts) {
            if (!shownGiftIds.has(gift.id)) {
              setGiftToShow({
                id: gift.id,
                itemName: gift.itemName,
                senderName: gift.sender.displayName || gift.sender.username,
                message: gift.message,
              });
              
              // Mark this gift as shown
              setShownGiftIds(prev => new Set([...prev, gift.id]));
              break; // Only show one at a time
            }
          }
        }
      } catch (error) {
        console.error("Error checking gifts:", error);
      }
    };

    checkGifts();
    
    // Check again every 5 seconds
    const interval = setInterval(checkGifts, 5000);
    return () => clearInterval(interval);
  }, [shownGiftIds]);

  return (
    <>
      {children}
      {giftToShow && (
        <GiftPopup
          gift={giftToShow}
          onClose={() => setGiftToShow(null)}
        />
      )}
    </>
  );
}
