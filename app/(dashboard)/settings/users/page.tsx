import Link from "next/link"
import { redirect } from "next/navigation"
import { getUsers, createUser, toggleUser } from "@/lib/actions/auth"
import { getSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ActionForm } from "@/components/action-form"

export default async function UsersPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    redirect("/")
  }

  const users = await getUsers()

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <Button render={<Link href="/settings">設定一覧</Link>} variant="outline" size="sm" nativeButton={false} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規ユーザー</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={createUser} submitLabel="登録" resetOnSuccess className="grid gap-4 sm:grid-cols-5 items-end">
            <div className="grid gap-2">
              <Label htmlFor="name">名前</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メール</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">権限</Label>
              <select id="role" name="role" defaultValue="CASHIER" className="h-9 rounded-md border px-2 text-sm">
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="CASHIER">CASHIER</option>
              </select>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">名前</th>
                <th className="px-4 py-3 text-left">メール</th>
                <th className="px-4 py-3 text-left">権限</th>
                <th className="px-4 py-3 text-left">状態</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.active ? "default" : "secondary"}>{user.active ? "有効" : "無効"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleUser.bind(null, user.id, !user.active)}>
                      <Button variant="outline" size="sm" type="submit">
                        {user.active ? "無効化" : "有効化"}
                      </Button>
                    </form>
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
