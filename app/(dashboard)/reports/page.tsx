import { getTransactionSummary } from "@/lib/actions/transactions"
import { transactionLabels } from "@/lib/transaction-labels"
import { getMembers } from "@/lib/actions/members"
import { getActiveSites } from "@/lib/actions/sites"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ReportsPage() {
  const [summary, members, sites] = await Promise.all([getTransactionSummary(), getMembers(), getActiveSites()])

  const { todayCount, todayTotals: typeTotals, allTimeTotals } = summary

  const siteBalances = sites.map((s) => ({ name: s.name, balance: s.account?.balance || 0 }))

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">レポート</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">本日の取引数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">会員合計残高</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.reduce((sum, m) => sum + (m.account?.balance || 0), 0).toLocaleString()} pt
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">サイト合計残高</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {siteBalances.reduce((sum, s) => sum + s.balance, 0).toLocaleString()} pt
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>本日の取引種別別</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(typeTotals).map(([type, total]) => (
                <li key={type} className="flex justify-between">
                  <span className="text-muted-foreground">{transactionLabels[type] || type}</span>
                  <span className="font-semibold">{total.toLocaleString()} pt</span>
                </li>
              ))}
              {Object.keys(typeTotals).length === 0 && <li className="text-muted-foreground">本日の取引はありません</li>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>サイト別残高</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {siteBalances.map((s) => (
                <li key={s.name} className="flex justify-between">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-semibold">{s.balance.toLocaleString()} pt</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全期間取引種別別合計</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(allTimeTotals).map(([type, total]) => (
              <li key={type} className="flex justify-between rounded-md border p-3">
                <span className="text-muted-foreground">{transactionLabels[type] || type}</span>
                <span className="font-semibold">{total.toLocaleString()} pt</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
