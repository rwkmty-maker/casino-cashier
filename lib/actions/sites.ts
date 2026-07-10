'use server'

import { revalidatePath } from "next/cache"
import * as z from "zod"
import { prisma } from "@/lib/db"
import { requireManagerOrAdmin, requireSession } from "@/lib/session"

const SiteSchema = z.object({
  name: z.string().min(1, "サイト名を入力してください"),
  slug: z.string().min(1, "スラッグを入力してください"),
  color: z.string().optional().or(z.literal("")),
  apiUrl: z.string().url().optional().or(z.literal("")),
  apiKey: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "MAINTENANCE", "DISABLED"]),
})

export async function createSite(_state: unknown, formData: FormData) {
  await requireManagerOrAdmin()
  const parsed = SiteSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    color: formData.get("color"),
    apiUrl: formData.get("apiUrl"),
    apiKey: formData.get("apiKey"),
    status: formData.get("status"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { name, slug, color, apiUrl, apiKey, status } = parsed.data

  try {
    await prisma.$transaction(async (tx) => {
      const site = await tx.site.create({
        data: { name, slug, color: color || null, apiUrl: apiUrl || null, apiKey: apiKey || null, status },
      })
      await tx.account.create({
        data: { type: "SITE", balance: 0, siteId: site.id },
      })
    })
  } catch {
    return { message: "スラッグが重複しています" }
  }

  revalidatePath("/settings/sites")
  return { success: true }
}

export async function updateSite(id: string, _state: unknown, formData: FormData) {
  await requireManagerOrAdmin()
  const parsed = SiteSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    color: formData.get("color"),
    apiUrl: formData.get("apiUrl"),
    apiKey: formData.get("apiKey"),
    status: formData.get("status"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { name, slug, color, apiUrl, apiKey, status } = parsed.data

  try {
    await prisma.site.update({
      where: { id },
      data: { name, slug, color: color || null, apiUrl: apiUrl || null, apiKey: apiKey || null, status },
    })
  } catch {
    return { message: "スラッグが重複しています" }
  }

  revalidatePath("/settings/sites")
  return { success: true }
}

export async function getSites() {
  await requireManagerOrAdmin()
  return prisma.site.findMany({
    orderBy: { order: "asc" },
    include: { account: true },
  })
}

export async function getActiveSites() {
  await requireSession()
  return prisma.site.findMany({
    where: { status: "ACTIVE" },
    orderBy: { order: "asc" },
    include: { account: true },
  })
}
