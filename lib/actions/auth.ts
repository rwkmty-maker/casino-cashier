'use server'

import { compare, hashSync } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import * as z from "zod"
import { prisma } from "@/lib/db"
import { getSession, requireAdmin } from "@/lib/session"

const LoginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
})

export async function login(_state: unknown, formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user || !user.active || !(await compare(password, user.passwordHash))) {
    return { message: "メールアドレスまたはパスワードが違います" }
  }

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
        passwordHash: hashSync(password, 10),
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
  await prisma.user.update({ where: { id }, data: { active } })
  revalidatePath("/settings/users")
}

export async function getUsers() {
  await requireAdmin()
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  })
}
