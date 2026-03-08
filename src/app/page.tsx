import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <h1 className="text-center text-2xl font-semibold">Zend POS</h1>
      <p className="text-center text-muted-foreground">
        สแกน QR ที่โต๊ะเพื่อสั่งอาหาร
      </p>
      <Link
        href="/login"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        เข้าสู่ระบบ (พนักงาน)
      </Link>
    </div>
  );
}