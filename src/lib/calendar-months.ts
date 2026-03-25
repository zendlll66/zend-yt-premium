/**
 * บวกจำนวนเดือนตามปฏิทิน — คงวันที่เดิมในเดือนเมื่อเป็นไปได้
 * (เช่น วันที่ 23 → วันที่ 23 ของเดือนถัดไป; 31 ม.ค. + 1 เดือน → สิ้นเดือน ก.พ.)
 */
export function addCalendarMonths(date: Date, months: number): Date {
  const m = Math.max(0, Math.floor(months));
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + m);
  if (d.getDate() !== day) {
    d.setDate(0);
  }
  return d;
}

/** วันหมดอายุจากวันเริ่ม + จำนวนเดือน */
export function expiresAtFromDurationMonths(activatedAt: Date, durationMonths: number): Date {
  const months = Math.max(1, Math.floor(durationMonths));
  return addCalendarMonths(activatedAt, months);
}
