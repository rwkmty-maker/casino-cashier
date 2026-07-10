import Link from "next/link"
import { notFound } from "next/navigation"
import { getMember } from "@/lib/actions/members"
import { getTransactionsByMember } from "@/lib/actions/transactions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { transactionLabels } from "@/lib/transaction-labels"

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [member, transactions] = await Promise.all([getMember(id), getTransactionsByMember(id)])
  if (!member) notFound()

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{member.name}</h1>
        <Button render={<Link href="/members">会員一覧</Link>} variant="outline" size="sm" nativeButton={false} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">会員コード</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{member.code}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">現在残高</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{member.account?.balance?.toLocaleString() ?? 0} pt</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">状態</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>{member.status}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近の取引</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">日時</th>
                <th className="px-4 py-3 text-left">種別</th>
                <th className="px-4 py-3 text-left">サイト</th>
                <th className="px-4 py-3 text-right">ポイント</th>
                <th className="px-4 py-3 text-left">備考</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{transactionLabels[t.type] || t.type}</Badge>
                  </td>
                  <td className="px-4 py-3">{t.site?.name || "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{t.amount.toLocaleString()} pt</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
