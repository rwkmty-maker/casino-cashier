"use client"

import { useState, useRef } from "react"
import { processTransaction } from "@/lib/actions/transactions"
import { searchMembers } from "@/lib/actions/members"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Search, X, User, Building2, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const presets = [1000, 5000, 10000, 50000, 100000]

const typeOptions = [
  { value: "BUY", label: "購入", color: "bg-primary text-primary-foreground" },
  { value: "SELL", label: "換金", color: "bg-secondary" },
  { value: "DEPOSIT_TO_SITE", label: "サイトへ振替", color: "bg-blue-500/10 text-blue-600" },
  { value: "WITHDRAW_FROM_SITE", label: "サイトから戻し", color: "bg-amber-500/10 text-amber-600" },
  { value: "BONUS", label: "ボーナス", color: "bg-emerald-500/10 text-emerald-600" },
  { value: "ADJUST", label: "調整", color: "bg-purple-500/10 text-purple-600" },
]

interface Site {
  id: string
  name: string
  slug: string
  color?: string | null
}

interface Member {
  id: string
  code: string
  name: string
  account?: { balance: number } | null
}

interface SeatData {
  id: string
  number: number
  member?: Member | null
  site?: Site | null
}

interface CashierPanelProps {
  sites: Site[]
  seat?: SeatData | null
  userRole?: "ADMIN" | "MANAGER" | "CASHIER"
}

export function CashierPanel({ sites, seat, userRole }: CashierPanelProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(seat?.member || null)
  const [selectedSite, setSelectedSite] = useState<Site | null>(seat?.site || null)
  const [type, setType] = useState<string>("BUY")
  const [amount, setAmount] = useState<string>("")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Member[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchTimeout = useRef<number | null>(null)

  const showSite = type === "DEPOSIT_TO_SITE" || type === "WITHDRAW_FROM_SITE"

  const handleSearch = (value: string) => {
    setQuery(value)
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current)
    if (!value.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    searchTimeout.current = window.setTimeout(async () => {
      try {
        const members = await searchMembers(value)
        setResults(members as Member[])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  const handlePreset = (value: number) => {
    setAmount(String(value))
  }

  const canAdjust = userRole === "ADMIN" || userRole === "MANAGER"

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    try {
      const result = await processTransaction(null, formData)
      if (result?.success) {
        toast.success("取引が完了しました")
        setAmount("")
        setSelectedMember(null)
        setSelectedSite(null)
      } else {
        const message = result?.message || (result?.errors ? Object.values(result.errors).flat().join(", ") : "取引に失敗しました")
        setError(message)
        toast.error(message)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              会員選択
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {selectedMember ? (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">{selectedMember.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedMember.code}</div>
                  <div className="text-sm font-semibold">
                    残高: {selectedMember.account?.balance?.toLocaleString() ?? 0} pt
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedMember(null)}>
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="会員コード・氏名で検索"
                  className="pl-9"
                  value={query}
                  onValueChange={(value) => handleSearch(value)}
                />
                {isSearching && <div className="absolute right-3 top-2 text-xs text-muted-foreground">検索中...</div>}
                {results.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow">
                    {results.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMember(m)
                          setQuery("")
                          setResults([])
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted"
                      >
                        <span className="font-medium">{m.name}</span>
                        <span className="text-sm text-muted-foreground">{m.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <form action={handleSubmit} className="grid gap-6">
          <input type="hidden" name="memberId" value={selectedMember?.id || ""} />
          <input type="hidden" name="type" value={type} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="size-5" />
                取引種別
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {typeOptions
                  .filter((t) => t.value !== "ADJUST" || canAdjust)
                  .map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        type === t.value ? t.color : "bg-card hover:bg-muted"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>

          {showSite && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="size-5" />
                  サイト
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {sites.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSite(s)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        selectedSite?.id === s.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                {selectedSite && <Badge variant="outline">{selectedSite.name}</Badge>}
                <input type="hidden" name="siteId" value={selectedSite?.id || ""} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>金額</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">ポイント</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="0"
                  value={amount}
                  onValueChange={(value) => setAmount(value)}
                  className="text-lg"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Button key={p} type="button" variant="outline" size="sm" onClick={() => handlePreset(p)}>
                    {p.toLocaleString()}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>備考</CardTitle>
            </CardHeader>
            <CardContent>
              <Input name="description" placeholder="備考（任意）" />
            </CardContent>
          </Card>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <Button type="submit" disabled={isPending || !selectedMember} className="w-full">
            {isPending ? "処理中..." : "取引実行"}
          </Button>
        </form>
      </div>

      <div>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>操作ガイド</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. 会員を検索・選択</p>
            <p>2. 取引種別を選択</p>
            <p>3. サイトが必要な場合は選択</p>
            <p>4. ポイントを入力して実行</p>
            <div className="rounded-md bg-muted p-3 text-xs">
              <p>購入：会員にポイントを付与</p>
              <p>換金：会員からポイントを回収</p>
              <p>サイトへ：会員残高からサイトへ振替</p>
              <p>サイトから：サイト残高を会員へ戻す</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
