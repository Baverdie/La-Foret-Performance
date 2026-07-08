'use client';

import { motion } from 'framer-motion';

// Titre de section — direction C (éditorial) : sur-titre court entre tirets, puis grand titre.
// Parametres: title (titre affiché), subtitle (sur-titre court optionnel).
export default function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="text-center mb-14"
    >
      <div className="flex items-center justify-center gap-4 text-white/40 mb-3">
        <span>──</span>
        {subtitle && <span className="uppercase tracking-[0.4em] text-xs font-display whitespace-nowrap">{subtitle}</span>}
        <span>──</span>
      </div>
      <h1 className="text-5xl md:text-7xl font-display tracking-widest uppercase text-white">{title}</h1>
    </motion.div>
  );
}
