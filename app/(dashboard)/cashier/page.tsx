import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getActiveSites } from "@/lib/actions/sites"
import { getSeat } from "@/lib/actions/seats"
import { CashierPanel } from "@/components/cashier-panel"

export default async function CashierPage({ searchParams }: { searchParams: Promise<{ seat?: string }> }) {
  const session = await getSession()
  const { seat } = await searchParams
  const [sites, seatData] = await Promise.all([getActiveSites(), seat ? getSeat(seat) : Promise.resolve(null)])

  if (!session.isLoggedIn) {
    redirect("/login")
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">キャッシャー</h1>
      <CashierPanel
        key={seatData?.id || "new"}
        sites={sites}
        seat={seatData}
        userRole={session.role}
      />
    </div>
  )
}
