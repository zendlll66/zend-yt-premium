"use server";

import { findOrdersByDateRange } from "@/features/order/order.repo";

function escapeCsvCell(value: string | number | Date | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

/**
 * ส่งออกรายงานคำสั่งเช่า/รายได้เป็น CSV ตามช่วงวันที่
 */
export async function exportOrdersReportCSV(from: Date, to: Date): Promise<{ csv: string; filename: string }> {
  const orders = await findOrdersByDateRange(from, to);
  const headers = [
    "เลขที่ออเดอร์",
    "สถานะ",
    "ยอดรวม (บาท)",
    "มัดจำ (บาท)",
    "วันเช่าเริ่ม",
    "วันเช่าสิ้นสุด",
    "ชื่อลูกค้า",
    "อีเมลลูกค้า",
    "วันที่สร้าง",
  ];
  const rows = orders.map((o) => [
    escapeCsvCell(o.orderNumber),
    escapeCsvCell(o.status),
    escapeCsvCell(o.totalPrice),
    escapeCsvCell(o.depositAmount),
    escapeCsvCell(o.rentalStart ? formatDate(o.rentalStart) : ""),
    escapeCsvCell(o.rentalEnd ? formatDate(o.rentalEnd) : ""),
    escapeCsvCell(o.customerName),
    escapeCsvCell(o.customerEmail),
    escapeCsvCell(o.createdAt ? formatDate(o.createdAt) : ""),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const fromStr = formatDate(from);
  const toStr = formatDate(to);
  const filename = `orders-report-${fromStr}-${toStr}.csv`;
  return { csv, filename };
}
