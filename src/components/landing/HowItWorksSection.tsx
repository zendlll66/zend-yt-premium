import { motion } from "framer-motion";

const STEPS = [
  { step: 1, title: "เลือกสินค้า", detail: "เลือกหมวดและรายการที่ต้องการเช่า กำหนดวันที่เริ่ม-คืน" },
  { step: 2, title: "กรอกข้อมูล & ชำระเงิน", detail: "ลงทะเบียนหรือเข้าสู่ระบบ ชำระผ่านบัตรด้วย Stripe" },
  { step: 3, title: "รับของ & คืนตามกำหนด", detail: "รับสินค้าตามที่อยู่จัดส่ง คืนตามวันที่กำหนด" },
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
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            ใช้บริการอย่างไร
          </h2>
          <p className="mt-2 text-muted-foreground">
            3 ขั้นตอน สะดวก รวดเร็ว
          </p>
        </motion.div>
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
                {s.step}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

