import Link from "next/link"
import { getMembers } from "@/lib/actions/members"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createMember } from "@/lib/actions/members"
import { ActionForm } from "@/components/action-form"

export default async function MembersPage() {
  const members = await getMembers()

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">会員管理</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規会員登録</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={createMember} submitLabel="登録" resetOnSuccess className="grid gap-4 sm:grid-cols-5">
            <div className="grid gap-2">
              <Label htmlFor="code">会員コード</Label>
              <Input id="code" name="code" placeholder="M001" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">氏名</Label>
              <Input id="name" name="name" placeholder="山田 太郎" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メール</Label>
              <Input id="email" name="email" type="email" placeholder="optional" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">電話</Label>
              <Input id="phone" name="phone" placeholder="optional" />
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">コード</th>
                <th className="px-4 py-3 text-left">氏名</th>
                <th className="px-4 py-3 text-left">メール</th>
                <th className="px-4 py-3 text-right">残高</th>
                <th className="px-4 py-3 text-left">状態</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{member.code}</td>
                  <td className="px-4 py-3">{member.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email || "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {member.account?.balance?.toLocaleString() ?? 0} pt
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>{member.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button render={<Link href={`/members/${member.id}`}>詳細</Link>} variant="ghost" size="sm" nativeButton={false} />
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
