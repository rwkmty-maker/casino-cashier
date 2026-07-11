import Link from "next/link"
import { getSites, createSite, updateSite } from "@/lib/actions/sites"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ActionForm } from "@/components/action-form"

export default async function SitesPage() {
  const sites = await getSites()

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">サイト管理</h1>
        <Button render={<Link href="/settings">設定一覧</Link>} variant="outline" size="sm" nativeButton={false} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規サイト</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={createSite} submitLabel="登録" resetOnSuccess className="grid gap-4 sm:grid-cols-6 items-end">
            <div className="grid gap-2">
              <Label htmlFor="name">サイト名</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">スラッグ</Label>
              <Input id="slug" name="slug" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">色</Label>
              <Input id="color" name="color" placeholder="#3b82f6" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiUrl">API URL</Label>
              <Input id="apiUrl" name="apiUrl" placeholder="https://..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">状態</Label>
              <select id="status" name="status" defaultValue="ACTIVE" className="h-9 rounded-md border px-2 text-sm">
                <option value="ACTIVE">有効</option>
                <option value="MAINTENANCE">メンテナンス</option>
                <option value="DISABLED">無効</option>
              </select>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {sites.map((site) => (
          <Card key={site.id}>
            <CardContent className="p-4">
              <ActionForm action={updateSite.bind(null, site.id)} submitLabel="更新" className="grid gap-4 sm:grid-cols-7 items-end">
                <div className="grid gap-2">
                  <Label htmlFor={`name-${site.id}`}>サイト名</Label>
                  <Input id={`name-${site.id}`} name="name" defaultValue={site.name} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`slug-${site.id}`}>スラッグ</Label>
                  <Input id={`slug-${site.id}`} name="slug" defaultValue={site.slug} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`color-${site.id}`}>色</Label>
                  <Input id={`color-${site.id}`} name="color" defaultValue={site.color || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`apiUrl-${site.id}`}>API URL</Label>
                  <Input id={`apiUrl-${site.id}`} name="apiUrl" defaultValue={site.apiUrl || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`status-${site.id}`}>状態</Label>
                  <select id={`status-${site.id}`} name="status" defaultValue={site.status} className="h-9 rounded-md border px-2 text-sm">
                    <option value="ACTIVE">有効</option>
                    <option value="MAINTENANCE">メンテナンス</option>
                    <option value="DISABLED">無効</option>
                  </select>
                </div>
                <div className="flex items-center pb-2">
                  <Badge variant={site.status === "ACTIVE" ? "default" : "secondary"}>{site.status}</Badge>
                </div>
              </ActionForm>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
