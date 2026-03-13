import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section id="contact" className="relative overflow-hidden border-t border-white/10 bg-neutral-950 py-20 text-white md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(120,80,200,0.2),transparent)]" />
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-medium uppercase tracking-widest text-violet-300"
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
          className="mt-4 text-white/70"
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
          <Button size="lg" className="rounded-full bg-violet-500 px-8 hover:bg-violet-600" asChild>
            <Link href="/rent">ไปหน้ารายการแพ็กเกจ</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/register">สมัครสมาชิก</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

