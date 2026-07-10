'use server'

import { revalidatePath } from "next/cache"
import * as z from "zod"
import { prisma } from "@/lib/db"
import { requireSession } from "@/lib/session"

const MemberSchema = z.object({
  code: z.string().min(1, "会員コードを入力してください"),
  name: z.string().min(1, "氏名を入力してください"),
  email: z.string().email().optional().or(z.literal("")).nullish(),
  phone: z.string().optional().or(z.literal("")).nullish(),
  note: z.string().optional().or(z.literal("")).nullish(),
})

export async function createMember(_state: unknown, formData: FormData) {
  await requireSession()
  const parsed = MemberSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    note: formData.get("note"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { code, name, email, phone, note } = parsed.data

  try {
    await prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          code,
          name,
          email: email || null,
          phone: phone || null,
          note: note || null,
        },
      })
      await tx.account.create({
        data: {
          type: "MEMBER",
          balance: 0,
          memberId: member.id,
        },
      })
    })
  } catch {
    return { message: "会員コードが重複しています" }
  }

  revalidatePath("/members")
  return { success: true }
}

export async function updateMember(id: string, _state: unknown, formData: FormData) {
  await requireSession()
  const parsed = MemberSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    note: formData.get("note"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { code, name, email, phone, note } = parsed.data

  try {
    await prisma.member.update({
      where: { id },
      data: {
        code,
        name,
        email: email || null,
        phone: phone || null,
        note: note || null,
      },
    })
  } catch {
    return { message: "会員コードが重複しています" }
  }

  revalidatePath("/members")
  return { success: true }
}

export async function searchMembers(query: string) {
  await requireSession()
  if (!query) return []

  return prisma.member.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { code: { contains: query } },
        { name: { contains: query } },
        { email: { contains: query } },
      ],
    },
    take: 20,
    include: { account: true },
    orderBy: { name: "asc" },
  })
}

export async function getMembers() {
  await requireSession()
  return prisma.member.findMany({
    orderBy: { createdAt: "desc" },
    include: { account: true },
  })
}

export async function getMember(id: string) {
  await requireSession()
  return prisma.member.findUnique({
    where: { id },
    include: { account: true, transactions: { include: { site: true, createdBy: true }, orderBy: { createdAt: "desc" }, take: 50 } },
  })
}
