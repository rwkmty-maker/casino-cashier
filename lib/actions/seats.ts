'use server'

import { revalidatePath } from "next/cache"
import * as z from "zod"
import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/session"

const AssignSchema = z.object({
  seatId: z.string().cuid(),
  memberId: z.string().optional().or(z.literal("")),
  siteId: z.string().optional().or(z.literal("")),
})

const SeatIdSchema = z.object({
  seatId: z.string().cuid(),
})

const SeatStatusSchema = z.object({
  seatId: z.string().cuid(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]),
})

export async function assignSeat(_state: unknown, formData: FormData) {
  await requireSession()
  const parsed = AssignSchema.safeParse({
    seatId: formData.get("seatId"),
    memberId: formData.get("memberId"),
    siteId: formData.get("siteId"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { seatId, memberId, siteId } = parsed.data

  const status = memberId ? "OCCUPIED" : "AVAILABLE"
  await prisma.seat.update({
    where: { id: seatId },
    data: {
      memberId: memberId || null,
      siteId: siteId || null,
      status,
      startedAt: memberId ? new Date() : null,
    },
  })

  revalidatePath("/")
  revalidatePath("/cashier")
  return { success: true }
}

export async function unassignSeat(seatId: string) {
  await requireSession()

  const parsed = SeatIdSchema.safeParse({ seatId })
  if (!parsed.success) {
    return { message: "入力が不正です" }
  }

  await prisma.seat.update({
    where: { id: parsed.data.seatId },
    data: { memberId: null, siteId: null, status: "AVAILABLE", startedAt: null },
  })
  revalidatePath("/")
  revalidatePath("/cashier")
  return { success: true }
}

export async function setSeatStatus(seatId: string, status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE") {
  await requireSession()

  const parsed = SeatStatusSchema.safeParse({ seatId, status })
  if (!parsed.success) {
    return { message: "入力が不正です" }
  }

  await prisma.seat.update({
    where: { id: parsed.data.seatId },
    data: { status: parsed.data.status, memberId: parsed.data.status === "OCCUPIED" ? undefined : null, siteId: parsed.data.status === "OCCUPIED" ? undefined : null },
  })
  revalidatePath("/")
  return { success: true }
}

export async function getSeats() {
  await requireSession()
  return prisma.seat.findMany({
    orderBy: { number: "asc" },
    include: { member: { include: { account: true } }, site: true },
  })
}

export async function getSeat(id: string) {
  await requireSession()
  return prisma.seat.findUnique({
    where: { id },
    include: { member: { include: { account: true } }, site: true },
  })
}
