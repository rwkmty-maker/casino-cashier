'use server'

import { revalidatePath } from "next/cache"
import * as z from "zod"
import { prisma, TransactionType } from "@/lib/db"
import type { Transaction } from "@/lib/db"
import { Prisma } from "@/lib/generated/prisma/client"
import { requireSession, requireManagerOrAdmin } from "@/lib/session"

const TransactionSchema = z.object({
  type: z.enum(["BUY", "SELL", "DEPOSIT_TO_SITE", "WITHDRAW_FROM_SITE", "ADJUST", "BONUS"]),
  memberId: z.string().min(1, "会員を選択してください"),
  siteId: z.string().optional().or(z.literal("")).nullish(),
  amount: z.coerce.number().int().min(1, "1以上のポイントを入力してください"),
  description: z.string().optional().or(z.literal("")).nullish(),
})

async function getHouseAccount(tx: Prisma.TransactionClient) {
  const house = await tx.account.findFirst({ where: { type: "HOUSE" } })
  if (!house) throw new Error("House account not found")
  return house
}

async function getMemberAccount(tx: Prisma.TransactionClient, memberId: string) {
  const account = await tx.account.findFirst({ where: { type: "MEMBER", memberId }, include: { member: true } })
  if (!account) throw new Error("Member account not found")
  if (account.member?.status !== "ACTIVE") throw new Error("会員が無効な状態です")
  return account
}

async function getSiteAccount(tx: Prisma.TransactionClient, siteId: string) {
  const account = await tx.account.findFirst({ where: { type: "SITE", siteId } })
  if (!account) throw new Error("Site account not found")
  return account
}

async function debitAccount(tx: Prisma.TransactionClient, accountId: string, amount: number, allowNegative: boolean) {
  const where = allowNegative
    ? { id: accountId }
    : { id: accountId, balance: { gte: amount } }

  try {
    const account = await tx.account.update({
      where,
      data: { balance: { decrement: amount } },
    })
    return account
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw new Error("残高が不足しています")
    }
    throw e
  }
}

async function creditAccount(tx: Prisma.TransactionClient, accountId: string, amount: number) {
  return tx.account.update({
    where: { id: accountId },
    data: { balance: { increment: amount } },
  })
}

async function createTransaction(
  tx: Prisma.TransactionClient,
  type: string,
  amount: number,
  description: string,
  fromAccountId: string,
  toAccountId: string,
  memberId: string,
  siteId: string | null,
  createdById: string,
  allowNegativeDebit = false
) {
  const [from, to] = await Promise.all([
    debitAccount(tx, fromAccountId, amount, allowNegativeDebit),
    creditAccount(tx, toAccountId, amount),
  ])

  const transaction = await tx.transaction.create({
    data: {
      type: type as TransactionType,
      amount,
      description,
      memberId,
      siteId,
      createdById,
      status: "COMPLETED",
    },
  })

  await tx.ledgerEntry.createMany({
    data: [
      { transactionId: transaction.id, accountId: fromAccountId, debit: amount, credit: 0, balanceAfter: from.balance },
      { transactionId: transaction.id, accountId: toAccountId, debit: 0, credit: amount, balanceAfter: to.balance },
    ],
  })

  return transaction
}

async function createReversal(
  tx: Prisma.TransactionClient,
  original: Transaction,
  createdById: string
) {
  const originalEntries = await tx.ledgerEntry.findMany({
    where: { transactionId: original.id },
  })

  const creditAccountId = originalEntries.find((e) => e.credit > 0)?.accountId
  const debitAccountId = originalEntries.find((e) => e.debit > 0)?.accountId

  if (!creditAccountId || !debitAccountId) {
    throw new Error("Original ledger entries not found")
  }

  const creditAccountRecord = await tx.account.findUnique({ where: { id: creditAccountId } })
  const allowNegative = creditAccountRecord?.type === "HOUSE"

  const [from, to] = await Promise.all([
    debitAccount(tx, creditAccountId, original.amount, allowNegative),
    creditAccount(tx, debitAccountId, original.amount),
  ])

  const reversal = await tx.transaction.create({
    data: {
      type: "REVERSAL",
      amount: original.amount,
      description: `取消: ${original.description || original.id}`,
      memberId: original.memberId,
      siteId: original.siteId,
      createdById,
      relatedTransactionId: original.id,
      status: "COMPLETED",
    },
  })

  await tx.ledgerEntry.createMany({
    data: [
      { transactionId: reversal.id, accountId: creditAccountId, debit: original.amount, credit: 0, balanceAfter: from.balance },
      { transactionId: reversal.id, accountId: debitAccountId, debit: 0, credit: original.amount, balanceAfter: to.balance },
    ],
  })

  await tx.transaction.update({
    where: { id: original.id },
    data: { status: "CANCELLED" },
  })

  return reversal
}

export async function processTransaction(_state: unknown, formData: FormData) {
  const session = await requireSession()
  const parsed = TransactionSchema.safeParse({
    type: formData.get("type"),
    memberId: formData.get("memberId"),
    siteId: formData.get("siteId"),
    amount: formData.get("amount"),
    description: formData.get("description"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { type, memberId, siteId, amount, description } = parsed.data

  if (type === "ADJUST" && session.role !== "ADMIN" && session.role !== "MANAGER") {
    return { message: "調整は管理者権限が必要です" }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const house = await getHouseAccount(tx)
      const memberAccount = await getMemberAccount(tx, memberId)

      if (type === "BUY" || type === "BONUS") {
        // HOUSE -> MEMBER
        await createTransaction(tx, type, amount, description || "", house.id, memberAccount.id, memberId, siteId || null, session.userId!, true)
      } else if (type === "SELL") {
        // MEMBER -> HOUSE
        await createTransaction(tx, type, amount, description || "", memberAccount.id, house.id, memberId, siteId || null, session.userId!, false)
      } else if (type === "ADJUST") {
        // Positive adjustment: HOUSE -> MEMBER. Negative adjustment not supported in this form.
        await createTransaction(tx, type, amount, description || "", house.id, memberAccount.id, memberId, siteId || null, session.userId!, true)
      } else if (type === "DEPOSIT_TO_SITE" || type === "WITHDRAW_FROM_SITE") {
        if (!siteId) throw new Error("サイトを選択してください")
        const siteAccount = await getSiteAccount(tx, siteId)
        if (type === "DEPOSIT_TO_SITE") {
          // MEMBER -> SITE
          await createTransaction(tx, type, amount, description || "", memberAccount.id, siteAccount.id, memberId, siteId, session.userId!, false)
        } else {
          // SITE -> MEMBER
          await createTransaction(tx, type, amount, description || "", siteAccount.id, memberAccount.id, memberId, siteId, session.userId!, false)
        }
      }
    })
  } catch (e: unknown) {
    return { message: e instanceof Error ? e.message : "取引に失敗しました" }
  }

  revalidatePath("/cashier")
  revalidatePath("/transactions")
  revalidatePath("/reports")
  return { success: true }
}

const ReverseTransactionSchema = z.object({
  transactionId: z.string().cuid(),
})

export async function reverseTransaction(transactionId: string) {
  const session = await requireManagerOrAdmin()

  const parsed = ReverseTransactionSchema.safeParse({ transactionId })
  if (!parsed.success) {
    return { message: "取引IDが不正です" }
  }

  const original = await prisma.transaction.findUnique({
    where: { id: parsed.data.transactionId },
  })

  if (!original || original.status !== "COMPLETED" || original.type === "REVERSAL") {
    return { message: "取消できない取引です" }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await createReversal(tx, original, session.userId!)
    })
  } catch (e: unknown) {
    return { message: e instanceof Error ? e.message : "取消に失敗しました" }
  }

  revalidatePath("/transactions")
  revalidatePath("/reports")
  return { success: true }
}

export async function getTransactions(take = 100) {
  await requireSession()
  return prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      member: { include: { account: true } },
      site: true,
      createdBy: { select: { name: true } },
      ledgerEntries: { include: { account: true } },
    },
  })
}

export async function getTransactionSummary() {
  await requireSession()
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))

  const [todayCount, todayGroups, allTimeGroups] = await Promise.all([
    prisma.transaction.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { createdAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { status: { not: "CANCELLED" } },
      _sum: { amount: true },
    }),
  ])

  const toMap = (groups: { type: string; _sum: { amount: number | null } }[]) => {
    const map: Record<string, number> = {}
    for (const g of groups) {
      if (typeof g._sum.amount === "number") map[g.type] = g._sum.amount
    }
    return map
  }

  return { todayCount, todayTotals: toMap(todayGroups), allTimeTotals: toMap(allTimeGroups) }
}

export async function getTransactionsByMember(memberId: string) {
  await requireSession()
  return prisma.transaction.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      member: { include: { account: true } },
      site: true,
      createdBy: { select: { name: true } },
      ledgerEntries: { include: { account: true } },
    },
  })
}


