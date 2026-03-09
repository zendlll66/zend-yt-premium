import { redirect } from "next/navigation";

/** เดิมเป็นสั่งอาหารตามโต๊ะ ตอนนี้เปลี่ยนเป็นระบบเช่า - redirect ไป /rent */
type Props = { params: Promise<{ token: string }> };

export default async function OrderPage({ params }: Props) {
  await params;
  redirect("/rent");
}
