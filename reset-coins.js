import { prisma } from "./lib/db.js";

async function resetCoins() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: "moomooking5312" },
    });

    if (!user) {
      console.log("User not found");
      process.exit(1);
    }

    console.log(`Found user: ${user.username}, current coins: ${user.coins}`);

    const updated = await prisma.user.update({
      where: { username: "moomooking5312" },
      data: { coins: 0 },
      select: { username: true, coins: true },
    });

    console.log(`✅ Coins reset successfully. New balance: ${updated.coins}`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

resetCoins();
