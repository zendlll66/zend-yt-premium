import { motion } from "framer-motion";
import { Search, CreditCard, PackageCheck } from "lucide-react";

const STEPS = [
  {
    step: 1,
    icon: Search,
    title: "เลือกสินค้า",
    detail: "เลือกหมวดและรายการที่ต้องการเช่า กำหนดวันที่เริ่ม-คืน",
  },
  {
    step: 2,
    icon: CreditCard,
    title: "กรอกข้อมูล & ชำระเงิน",
    detail: "ลงทะเบียนหรือเข้าสู่ระบบ ชำระผ่านบัตรด้วย Stripe",
  },
  {
    step: 3,
    icon: PackageCheck,
    title: "รับของ & คืนตามกำหนด",
    detail: "รับสินค้าตามที่อยู่จัดส่ง คืนตามวันที่กำหนด",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-border bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
            ขั้นตอน
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            ใช้บริการอย่างไร
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            3 ขั้นตอน สะดวก รวดเร็ว
          </p>
        </motion.div>
        <div className="relative grid gap-8 md:grid-cols-3">
          {/* เส้นเชื่อมระหว่างขั้น (แสดงบน desktop) */}
          <div className="absolute left-1/2 top-12 hidden h-0.5 w-[calc(100%-8rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/40 to-transparent md:block" />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/25">
                <s.icon className="h-8 w-8" />
              </div>
              <span className="relative z-10 mt-4 flex h-7 w-7 items-center justify-center rounded-full bg-background text-sm font-bold text-violet-600 ring-2 ring-violet-200 dark:ring-violet-800 dark:text-violet-400">
                {s.step}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

