import Link from "next/link"
import { getSession } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Users } from "lucide-react"

export default async function SettingsPage() {
  const session = await getSession()

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/settings/sites">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5" />
                サイト管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">サイトの登録・編集・API設定</p>
            </CardContent>
          </Card>
        </Link>

        {session.role === "ADMIN" && (
          <Link href="/settings/users">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5" />
                  ユーザー管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">キャッシャー/管理者アカウントの管理</p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  )
}
