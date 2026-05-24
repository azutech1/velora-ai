"use client";

import { motion } from "framer-motion";

export function TokenomicsCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="glass rounded-lg p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <div className="mt-4 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-gradient-to-r from-mint to-cyan" style={{ width: value }} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{detail}</p>
    </motion.div>
  );
}
