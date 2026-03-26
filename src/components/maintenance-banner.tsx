import { Wrench } from "lucide-react"

export function MaintenanceBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
      <Wrench className="h-4 w-4 shrink-0" />
      <span>{message || "ขณะนี้ระบบอยู่ระหว่างปิดปรับปรุง กรุณากลับมาใหม่ภายหลัง"}</span>
    </div>
  )
}
