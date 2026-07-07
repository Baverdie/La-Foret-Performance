'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

// Liens d'ancrage vers les sections de la landing.
const NAV_LINKS = [
	{ label: 'Accueil', href: '#hero' },
	{ label: 'Le Crew', href: '#crew' },
	{ label: 'Le Garage', href: '#garage' },
	{ label: 'Les Sorties', href: '#sorties' },
];

// Liens vers la boutique.
const SHOP_LINKS = [
	{ label: 'La Boutique', href: '/shop' },
	{ label: 'Panier', href: '/shop/panier' },
];

// Colonne de liens du footer : label en capitales espacées + liste sobre.
function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
	return (
		<div>
			<p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-5 font-display">{title}</p>
			<nav className="flex flex-col gap-3">
				{links.map((link) => (
					<a
						key={link.href}
						href={link.href}
						className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-[0.15em] w-fit"
					>
						{link.label}
					</a>
				))}
			</nav>
		</div>
	);
}

// Footer éditorial : wordmark géant signature, rangées structurées par filets 1px,
// liens en capitales espacées, Instagram en lien texte sobre.
export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="grain-bg relative bg-[#1a1a1a] overflow-hidden border-t border-white/10">
			<div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
				{/* Rangée 1 — lockup de marque centré (reprend le motif du logo : ── LA FORÊT PERFORMANCE ──) */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7 }}
					className="py-12 md:py-16 flex flex-col items-center text-center"
				>
					<div className="relative w-16 h-16 overflow-hidden border border-white/15 mb-6">
						<Image
							src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/logo-lfp.jpg"
							alt="LFP"
							fill
							sizes="64px"
							className="object-cover"
						/>
					</div>
					<div className="flex items-center gap-3 md:gap-4">
						<span className="text-white/40 font-light">──</span>
						<p className="font-landasans text-lg md:text-2xl tracking-[0.25em] text-white">LA FORÊT PERFORMANCE</p>
						<span className="text-white/40 font-light">──</span>
					</div>
					<p className="text-gray-400 text-sm mt-4">Pâturages et belles mécaniques en Charente-Maritime</p>
				</motion.div>

				{/* Rangée 2 — colonnes de liens */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.1 }}
					className="grid grid-cols-2 md:grid-cols-3 gap-10 border-t border-white/10 py-10 md:py-12"
				>
					<FooterColumn title="Navigation" links={NAV_LINKS} />
					<FooterColumn title="Boutique" links={SHOP_LINKS} />
					<div>
						<p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-5 font-display">Suivez-nous</p>
						<a
							href="https://instagram.com/la.foret.performance"
							target="_blank"
							rel="noopener noreferrer"
							className="group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
						>
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
							</svg>
							@la.foret.performance
							<span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
						</a>
					</div>
				</motion.div>

				{/* Rangée 3 — barre légale */}
				<div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t border-white/10 py-6">
					<p className="text-gray-500 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
						{/* Point de localisation : un glyphe reste rond */}
						<span className="w-1.5 h-1.5 rounded-full bg-lfp-amber inline-block" />
						Charente-Maritime, France
					</p>
					<p className="text-gray-500 text-xs">
						© {currentYear} La Forêt Performance · Développé par{' '}
						<a
							href="https://baverdie.dev"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-white transition-colors"
						>
							Baverdie
						</a>
					</p>
				</div>
			</div>

			{/* Grain texture */}
			<div className="grain" />
		</footer>
	);
}
