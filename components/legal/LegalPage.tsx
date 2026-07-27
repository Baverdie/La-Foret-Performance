import Link from 'next/link';
import { SHOP_ENABLED } from '@/lib/shop/flags';

interface LegalPageProps {
	// Titre de la page (affiché en Landasans capitales).
	title: string;
	// Date de dernière mise à jour (affichée sous le titre).
	updated: string;
	// Contenu de la page (h2 / h3 / p / ul stylés en cascade).
	children: React.ReactNode;
}

// Gabarit des pages légales : en-tête éditorial + prose sombre stylée en cascade,
// conforme à la DA (capitales espacées, filets 1px, angles droits).
export default function LegalPage({ title, updated, children }: LegalPageProps) {
	return (
		<div className="min-h-screen bg-[#1a1a1a] grain-bg text-white">
			<header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
				<div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between text-xs uppercase tracking-[0.2em]">
					<Link href="/" className="text-white font-display tracking-[0.25em] text-base normal-case">
						LFP
					</Link>
					<nav className="flex items-center gap-6">
						<Link href="/" className="text-gray-400 hover:text-white transition-colors">
							Le site
						</Link>
						{SHOP_ENABLED && (
							<Link href="/shop" className="text-gray-400 hover:text-white transition-colors">
								Boutique
							</Link>
						)}
					</nav>
				</div>
			</header>

			<main className="max-w-3xl mx-auto px-6 py-14 md:py-20 relative z-10">
				<div className="flex items-center gap-4 text-white/40 mb-3">
					<span>──</span>
					<span className="uppercase tracking-[0.4em] text-xs font-display">Informations légales</span>
				</div>
				<h1 className="text-4xl md:text-5xl font-display tracking-widest uppercase">{title}</h1>
				<p className="text-gray-500 text-xs uppercase tracking-[0.2em] mt-4">Dernière mise à jour : {updated}</p>

				<div
					className="mt-12 border-t border-white/10 pt-10
						[&_h2]:font-display [&_h2]:uppercase [&_h2]:tracking-[0.15em] [&_h2]:text-xl [&_h2]:text-white [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-white/10 [&_h2]:pb-3
						[&_h3]:uppercase [&_h3]:tracking-[0.2em] [&_h3]:text-sm [&_h3]:text-white/80 [&_h3]:mt-6 [&_h3]:mb-2
						[&_p]:text-gray-400 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-4
						[&_ul]:text-gray-400 [&_ul]:text-sm [&_ul]:leading-relaxed [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-['──_'] [&_li]:mb-1.5 [&_li]:pl-2
						[&_strong]:text-white/90 [&_strong]:font-medium
						[&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-white/30 hover:[&_a]:decoration-white"
				>
					{children}
				</div>
			</main>
		</div>
	);
}
