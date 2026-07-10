import Link from "next/link"
import { getSeats } from "@/lib/actions/seats"
import { getMembers } from "@/lib/actions/members"
import { getActiveSites } from "@/lib/actions/sites"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Monitor, Gamepad2 } from "lucide-react"

export default async function DashboardPage() {
  const [seats, members, sites] = await Promise.all([getSeats(), getMembers(), getActiveSites()])

  const occupied = seats.filter((s) => s.status === "OCCUPIED").length
  const available = seats.filter((s) => s.status === "AVAILABLE").length
  const activeMembers = members.filter((m) => m.status === "ACTIVE").length
  const totalMemberBalance = members.reduce((sum, m) => sum + (m.account?.balance || 0), 0)

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">空席 / 全席</CardTitle>
            <Monitor className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {available} / {seats.length}
            </div>
            <CardDescription>使用中: {occupied}</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">会員数</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <CardDescription>有効会員</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">会員合計残高</CardTitle>
            <Gamepad2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMemberBalance.toLocaleString()} pt</div>
            <CardDescription>全サイト合計</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">サイト</CardTitle>
            <Gamepad2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sites.length}</div>
            <CardDescription>稼働中</CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">フロア状況</h2>
        <Button render={<Link href="/cashier">キャッシャーへ</Link>} nativeButton={false} />
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        {seats.map((seat) => (
          <Link key={seat.id} href={`/cashier?seat=${seat.id}`}>
            <div
              className={`rounded-md border p-2 text-center transition-colors hover:bg-muted ${
                seat.status === "OCCUPIED"
                  ? "border-primary/50 bg-primary/5"
                  : seat.status === "MAINTENANCE"
                  ? "border-destructive/50 bg-destructive/5"
                  : "bg-card"
              }`}
            >
              <div className="text-xs text-muted-foreground">#{seat.number}</div>
              <div className="truncate text-xs font-medium">
                {seat.member ? seat.member.name : seat.status === "MAINTENANCE" ? "整備" : "空席"}
              </div>
              {seat.site && <Badge variant="outline" className="mt-1 text-[10px]">{seat.site.name}</Badge>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
