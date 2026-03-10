import { motion } from "framer-motion";
import { CreditCard, Shield, Package } from "lucide-react";

const FEATURES = [
  {
    icon: CreditCard,
    title: "ชำระง่าย",
    description: "รองรับบัตรเครดิตผ่าน Stripe ปลอดภัย มั่นใจได้",
  },
  {
    icon: Shield,
    title: "มัดจำชัดเจน",
    description: "ระบบมัดจำและคืนเงินเป็นมาตรฐาน โปร่งใส",
  },
  {
    icon: Package,
    title: "จัดส่งถึงที่",
    description: "จัดการที่อยู่จัดส่งได้หลายที่ เลือกที่รับของสะดวก",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            ทำไมต้อง Zend Rental
          </h2>
          <p className="mt-2 text-muted-foreground">
            กระบวนการเช่าง่าย ปลอดภัย โปร่งใส
          </p>
        </motion.div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-3xl border border-border/60 bg-card p-8 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

