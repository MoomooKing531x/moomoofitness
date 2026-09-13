const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkLevels() {
  const users = await prisma.user.findMany({
    select: {
      username: true,
      maxGameLevelReached: true,
      elo: true,
      gp: true,
      coins: true,
    },
  });

  console.log("Users and their max game levels:");
  users.forEach(user => {
    console.log(`${user.username}: maxGameLevelReached = ${user.maxGameLevelReached}, ELO = ${user.elo}, GP = ${user.gp}, Coins = ${user.coins}`);
  });

  await prisma.$disconnect();
}

checkLevels().catch(console.error);
