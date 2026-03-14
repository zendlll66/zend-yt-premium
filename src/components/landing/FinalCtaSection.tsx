import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section id="contact" className="relative overflow-hidden border-t border-brand-border bg-brand-bg py-20 text-brand-fg md:py-28">
      <div className="absolute inset-0 brand-gradient-bottom" />
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-medium uppercase tracking-widest text-brand-accent-muted"
        >
          เริ่มต้น
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          พร้อมเริ่มใช้งานแพ็กเกจแล้วหรือยัง?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-brand-fg-muted"
        >
          ซื้อแพ็กเกจที่ต้องการวันนี้ แล้วรับข้อมูลใช้งานพร้อมบันทึกใน Inventory ทันที
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button size="lg" className="rounded-full bg-brand-accent px-8 text-white hover:bg-brand-accent-hover" asChild>
            <Link href="/rent">ไปหน้ารายการแพ็กเกจ</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-brand-border bg-brand-bg-subtle text-brand-fg hover:bg-white/10 hover:text-brand-fg"
            asChild
          >
            <Link href="/register">สมัครสมาชิก</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

