"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "แดชบอร์ด",
  products: "จัดการสินค้า",
  categories: "หมวดหมู่สินค้า",
  "user-list": "รายการผู้ใช้",
  add: "เพิ่มผู้ใช้",
  edit: "แก้ไข",
  permissions: "สิทธิ์การเข้าถึงหน้า",
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const items: { href: string; label: string; isLast: boolean }[] = []
  let href = ""
  for (let i = 0; i < segments.length; i++) {
    href += "/" + segments[i]
    const key = segments[i]
    const label = SEGMENT_LABELS[key] ?? key
    items.push({ href, label, isLast: i === segments.length - 1 })
  }
  return items
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const items = getBreadcrumbs(pathname)

  if (items.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>แดชบอร์ด</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, i) => (
          <span key={item.href} className="contents">
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
