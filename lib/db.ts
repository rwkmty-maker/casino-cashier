import { PrismaClient } from "@/lib/generated/prisma/client"

export * from "@/lib/generated/prisma/enums"
export type { User, Member, Site, Seat, Account, Transaction, LedgerEntry } from "@/lib/generated/prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
