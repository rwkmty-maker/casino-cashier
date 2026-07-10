"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Menu, LayoutDashboard, Users, Banknote, ReceiptText, Settings, CircleUser } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavProps {
  user: { userId?: string; name?: string; role?: "ADMIN" | "MANAGER" | "CASHIER" }
}

const links = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/cashier", label: "キャッシャー", icon: Banknote },
  { href: "/members", label: "会員", icon: Users },
  { href: "/transactions", label: "履歴", icon: ReceiptText },
  { href: "/settings", label: "設定", icon: Settings },
]

export function Nav({ user }: NavProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">Amusement Cashier</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <CircleUser className="size-4" />
            <span>{user.name}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{user.role}</span>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              ログアウト
            </Button>
          </form>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden"><Menu className="size-4" /></Button>} />
            <SheetContent side="left" className="w-64">
              <div className="grid gap-4 py-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                      pathname === link.href ? "bg-muted" : "text-muted-foreground"
                    )}
                  >
                    <link.icon className="size-4" />
                    {link.label}
                  </Link>
                ))}
                <Separator />
                <div className="px-3 text-sm text-muted-foreground">
                  {user.name} <span className="text-xs">({user.role})</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
