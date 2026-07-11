import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { Nav } from "@/components/nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session.isLoggedIn) {
    redirect("/login")
  }

  return (
    <div className="min-h-svh">
      <Nav user={session} />
      <main className="p-4 md:p-6">{children}</main>
    </div>
  )
}
