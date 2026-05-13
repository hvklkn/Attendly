import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

type GlobalForPrisma = typeof globalThis & {
  attendlyPrisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalForPrisma;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  if (!globalForPrisma.attendlyPrisma) {
    globalForPrisma.attendlyPrisma = createPrismaClient();
  }

  return globalForPrisma.attendlyPrisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
});
