'use server'

import { revalidatePath } from "next/cache"
import * as z from "zod"
import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/session"

const AssignSchema = z.object({
  seatId: z.string(),
  memberId: z.string().optional().or(z.literal("")),
  siteId: z.string().optional().or(z.literal("")),
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
  await prisma.seat.update({
    where: { id: seatId },
    data: { memberId: null, siteId: null, status: "AVAILABLE", startedAt: null },
  })
  revalidatePath("/")
  revalidatePath("/cashier")
}

export async function setSeatStatus(seatId: string, status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE") {
  await requireSession()
  await prisma.seat.update({
    where: { id: seatId },
    data: { status, memberId: status === "OCCUPIED" ? undefined : null, siteId: status === "OCCUPIED" ? undefined : null },
  })
  revalidatePath("/")
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
