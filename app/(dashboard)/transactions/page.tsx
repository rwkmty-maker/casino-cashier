import { getTransactions } from "@/lib/actions/transactions"
import { transactionLabels } from "@/lib/transaction-labels"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function TransactionsPage() {
  const transactions = await getTransactions()

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">取引履歴</h1>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">日時</th>
                <th className="px-4 py-3 text-left">会員</th>
                <th className="px-4 py-3 text-left">種別</th>
                <th className="px-4 py-3 text-left">サイト</th>
                <th className="px-4 py-3 text-right">ポイント</th>
                <th className="px-4 py-3 text-left">担当</th>
                <th className="px-4 py-3 text-left">状態</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">{t.member?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{transactionLabels[t.type] || t.type}</Badge>
                  </td>
                  <td className="px-4 py-3">{t.site?.name || "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{t.amount.toLocaleString()} pt</td>
                  <td className="px-4 py-3">{t.createdBy.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={t.status === "COMPLETED" ? "default" : "secondary"}>{t.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
