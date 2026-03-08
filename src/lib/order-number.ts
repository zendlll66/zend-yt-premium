/**
 * สร้าง order number ที่ unique และอ่านง่าย
 * รูปแบบ: ORD-YYYYMMDD-HHmmss-XXXX (X = random alphanumeric)
 * ลดโอกาสซ้ำจาก timestamp + random 4 ตัว
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${date}-${time}-${rand}`;
}
