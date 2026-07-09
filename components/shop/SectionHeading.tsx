'use client';

import { motion } from 'framer-motion';

// Titre de section — direction C (éditorial) : sur-titre court entre tirets, puis grand titre.
// Parametres: title (titre affiché), subtitle (sur-titre optionnel),
// titleShort (variante courte affichée sous sm pour tenir sur une ligne).
export default function SectionHeading({
  title,
  subtitle,
  titleShort,
}: {
  title: string;
  subtitle?: string;
  titleShort?: string;
}) {
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
      {titleShort ? (
        <>
          <h1 className="sm:hidden text-5xl font-display tracking-widest uppercase text-white">{titleShort}</h1>
          <h1 className="hidden sm:block text-5xl md:text-7xl font-display tracking-widest uppercase text-white">{title}</h1>
        </>
      ) : (
        <h1 className="text-5xl md:text-7xl font-display tracking-widest uppercase text-white">{title}</h1>
      )}
    </motion.div>
  );
}
