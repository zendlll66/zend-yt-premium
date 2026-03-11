import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section id="contact" className="border-t border-border bg-neutral-950 py-20 text-white md:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          พร้อมเริ่มเช่าแล้วหรือยัง?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mt-4 text-white/70"
        >
          สมัครสมาชิกวันนี้ จองของที่ต้องการได้ทันที
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button size="lg" className="rounded-full px-8" asChild>
            <Link href="/rent">ไปหน้ารายการเช่า</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"
            asChild
          >
            <Link href="/register">สมัครสมาชิก</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

