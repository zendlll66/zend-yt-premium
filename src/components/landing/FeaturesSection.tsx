import { motion } from "framer-motion";
import { CreditCard, Shield, Package } from "lucide-react";

const FEATURES = [
  {
    icon: CreditCard,
    title: "ชำระเงินปลอดภัย",
    description: "รองรับบัตรเครดิตผ่าน Stripe พร้อมตรวจสอบสถานะคำสั่งซื้อแบบเรียลไทม์",
  },
  {
    icon: Shield,
    title: "จัดการสต็อกแม่นยำ",
    description: "แยกสต็อกตามประเภท Individual, Family, Invite และ Customer Account",
  },
  {
    icon: Package,
    title: "มี Inventory ให้ลูกค้า",
    description: "ลูกค้าดูข้อมูลอีเมล/รหัส/ลิงก์ และเช็กวันคงเหลือของแพ็กเกจได้เอง",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
            จุดเด่น
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            ทำไมต้องใช้บริการเรา
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            ออกแบบเพื่อร้านที่ขายรหัสดิจิทัลและแพ็กเกจพรีเมียมโดยเฉพาะ
          </p>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 shadow-sm transition hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 dark:hover:border-violet-800"
            >
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-violet-500/5 transition group-hover:bg-violet-500/10" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 transition group-hover:bg-violet-500/20 dark:text-violet-400">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="relative mt-5 text-xl font-semibold tracking-tight">{f.title}</h3>
              <p className="relative mt-2 text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

