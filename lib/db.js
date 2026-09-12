import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Prevent creating a new PrismaClient on every hot-reload in dev
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma, bcrypt };
