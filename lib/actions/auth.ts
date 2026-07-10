'use server'

import { compare, hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import * as z from "zod"
import { prisma } from "@/lib/db"
import { getSession, requireAdmin } from "@/lib/session"

const LoginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
})

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_ATTEMPTS = 5
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()

function isRateLimited(email: string) {
  const now = Date.now()
  const record = loginAttempts.get(email)
  if (!record) return false
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.delete(email)
    return false
  }
  return record.count >= RATE_LIMIT_MAX_ATTEMPTS
}

function recordLoginAttempt(email: string) {
  const now = Date.now()
  const record = loginAttempts.get(email)
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(email, { count: 1, firstAttempt: now })
  } else {
    record.count++
  }
}

function resetLoginAttempts(email: string) {
  loginAttempts.delete(email)
}

export async function login(_state: unknown, formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase()

  if (isRateLimited(normalizedEmail)) {
    return { message: "ログイン試行回数が多すぎます。しばらくしてからお試しください。" }
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user || !user.active || !(await compare(password, user.passwordHash))) {
    recordLoginAttempt(normalizedEmail)
    return { message: "メールアドレスまたはパスワードが違います" }
  }

  resetLoginAttempts(normalizedEmail)

  const session = await getSession()
  session.userId = user.id
  session.name = user.name
  session.role = user.role
  session.isLoggedIn = true
  await session.save()

  redirect("/")
}

export async function logout() {
  const session = await getSession()
  session.destroy()
  redirect("/login")
}

const UserCreateSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上にしてください"),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]),
})

const ToggleUserSchema = z.object({
  id: z.string().cuid(),
  active: z.boolean(),
})

export async function createUser(_state: unknown, formData: FormData) {
  await requireAdmin()

  const parsed = UserCreateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, password, role } = parsed.data

  try {
    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: await hash(password, 10),
        role,
      },
    })
  } catch {
    return { message: "同じメールアドレスのユーザーが既に存在します" }
  }

  revalidatePath("/settings/users")
  return { success: true }
}

export async function toggleUser(id: string, active: boolean) {
  await requireAdmin()

  const parsed = ToggleUserSchema.safeParse({ id, active })
  if (!parsed.success) {
    return
  }

  await prisma.user.update({ where: { id: parsed.data.id }, data: { active: parsed.data.active } })
  revalidatePath("/settings/users")
}

export async function getUsers() {
  await requireAdmin()
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  })
}
