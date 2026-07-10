import { cookies } from "next/headers"
import { getIronSession } from "iron-session"

export interface SessionData {
  userId?: string
  name?: string
  role?: "ADMIN" | "MANAGER" | "CASHIER"
  isLoggedIn?: boolean
}

const sessionOptions = {
  cookieName: "cashier_session",
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
  },
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

export async function requireSession() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function requireManagerOrAdmin() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId || (session.role !== "ADMIN" && session.role !== "MANAGER")) {
    throw new Error("Forbidden")
  }
  return session
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    throw new Error("Forbidden")
  }
  return session
}
