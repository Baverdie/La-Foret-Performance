'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';

interface HeroProps {
	// Présence des sections conditionnelles : pilote les entrées du menu mobile.
	hasCrew: boolean;
	hasGarage: boolean;
	hasSorties: boolean;
}

export default function Hero({ hasCrew, hasGarage, hasSorties }: HeroProps) {
	// Liens du menu mobile : seules les sections réellement rendues apparaissent,
	// la numérotation (01, 02…) suit l'ordre après filtrage.
	const menuLinks = [
		{ label: 'Accueil', href: '#hero', show: true },
		{ label: 'Le Crew', href: '#crew', show: hasCrew },
		{ label: 'Le Garage', href: '#garage', show: hasGarage },
		{ label: 'Les Sorties', href: '#sorties', show: hasSorties },
		{ label: 'La Boutique', href: '/shop', show: true },
	].filter((link) => link.show);

	const [displayText, setDisplayText] = useState('');
	const [isTypingComplete, setIsTypingComplete] = useState(false);
	const [showBackground, setShowBackground] = useState(false);
	const [showScrollIndicator, setShowScrollIndicator] = useState(false);
	const [showNav, setShowNav] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const fullText = 'LA FORÊT PERFORMANCE';
	const mobileText = 'LFP';

	// Verrouille le scroll de la page quand le menu mobile est ouvert.
	useEffect(() => {
		document.body.style.overflow = menuOpen ? 'hidden' : 'unset';
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [menuOpen]);

	// Bascule du menu protégée contre les doubles déclenchements iOS : un tap peut produire
	// pointerup PUIS click (« ghost click ») au même endroit — sans garde, le menu s'ouvre
	// et se referme instantanément (= « rien ne se passe » à l'écran).
	const lastToggleRef = useRef(0);
	const toggleMenu = () => {
		const now = Date.now();
		if (now - lastToggleRef.current < 350) return;
		lastToggleRef.current = now;
		setMenuOpen((open) => !open);
	};

	// Navigation depuis le menu : pour les ancres, on scrolle programmatiquement APRÈS le
	// déverrouillage du body — iOS ignore silencieusement un scroll d'ancre tant que
	// overflow:hidden est posé (le menu se fermait sans naviguer).
	const handleMenuLink = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
		setMenuOpen(false);
		if (href.startsWith('#')) {
			event.preventDefault();
			window.setTimeout(() => {
				document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
			}, 80);
		}
	};

	const { scrollY } = useScroll();

	// Titre lié 1:1 au scroll (MotionValues, aucun re-render, aucun lissage :
	// un ressort ajoute latence et effet de recul, macOS lisse déjà la molette).
	// Le titre accoste centré sur la rangée de nav desktop : py-5 (20px) + logo 40px → centre à 40px.
	const titleScale = useTransform(scrollY, [0, 300], [1, 0.4]);
	const titleY = useTransform(scrollY, [0, 300], [0, typeof window !== 'undefined' ? -(window.innerHeight / 2 - 40) : -350]);
	const scrollIndicatorOpacity = useTransform(scrollY, [0, 200], [1, 0]);

	const topGradientOpacity = useTransform(scrollY, [100, 300], [0, 1]);

	// Titre mobile : scrub progressif écrit CHAQUE FRAME par une boucle rAF qui lit scrollY
	// (indépendant du rythme des événements scroll). Ancré top:0 avec position de départ figée
	// au montage : le repli de la barre d'outils Safari redimensionne le viewport pendant le
	// scroll, ce qui faisait « téléporter » tout élément fixed centré en % (le vrai coupable).
	const mobileTitleRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const el = mobileTitleRef.current;
		if (!el) return;
		const startY = window.innerHeight / 2 - 24; // centre écran au montage (barre déployée)
		const endY = 14; // position accostée sous le haut de l'écran (zone navbar)
		const range = 350; // pixels de scroll pour parcourir tout le trajet (plus grand = plus lent)
		let raf = 0;
		let lastProgress = -1;
		const loop = () => {
			const progress = Math.min(Math.max(window.scrollY / range, 0), 1);
			if (progress !== lastProgress) {
				lastProgress = progress;
				const y = startY + (endY - startY) * progress;
				const scale = 1 - 0.45 * progress;
				el.style.transform = `translateX(-50%) translateY(${y}px) scale(${scale})`;
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, []);

	useEffect(() => {
		const textToType = window.innerWidth < 768 ? mobileText : fullText;
		const startTyping = setTimeout(() => {
			let currentIndex = 0;
			const typingInterval = setInterval(() => {
				if (currentIndex <= textToType.length) {
					setDisplayText(textToType.slice(0, currentIndex));
					currentIndex++;
				} else {
					setIsTypingComplete(true);
					clearInterval(typingInterval);
					setTimeout(() => {
						setShowBackground(true);
						setTimeout(() => {
							setShowNav(true);
						}, 500);
						setTimeout(() => {
							setShowScrollIndicator(true);
						}, 2000);
					}, 500);
				}
			}, 80);
		}, 600);

		return () => clearTimeout(startTyping);
	}, []);

	return (
		<>
			<motion.nav
				initial={{ y: -100, opacity: 0 }}
				animate={{
					y: showNav ? 0 : -100,
					opacity: showNav ? 1 : 0
				}}
				transition={{ duration: 0.6, ease: 'easeOut' }}
				className="md:hidden fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-md border-b border-white/10 z-90"
				style={{
					paddingTop: 'max(env(safe-area-inset-top), 0px)',
					// Menu ouvert : la navbar passe au-dessus de l'overlay (z-150) pour que
					// le bouton, devenu croix, reste visible et cliquable au même endroit.
					zIndex: menuOpen ? 160 : undefined,
				}}
			>
				<div className="flex items-center justify-between px-6 py-4">
					<div className="w-10 h-10 rounded-none border border-white/15 flex items-center justify-center">
						<Image
							src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/logo-lfp.jpg"
							alt="LFP"
							width={36}
							height={36}
							className="object-cover rounded-none"
						/>
					</div>

					{/* Bouton menu : unique (il se transforme en croix, même position → pas de
					    « ghost click » iOS possible), pointerup + click dédupliqués par toggleMenu. */}
					<button
						onPointerUp={toggleMenu}
						onClick={toggleMenu}
						aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
						type="button"
						className="w-11 h-11 flex items-center justify-center cursor-pointer"
					>
						{menuOpen ? (
							<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						) : (
							<span className="flex flex-col items-end gap-1.5 w-6">
								<span className="block h-px w-6 bg-white" />
								<span className="block h-px w-4 bg-white" />
							</span>
						)}
					</button>
				</div>
			</motion.nav>

			{/* Menu mobile plein écran */}
			<AnimatePresence>
				{menuOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25 }}
						className="md:hidden fixed inset-0 z-150 bg-[#0a0a0a] flex flex-col"
						style={{ paddingTop: 'calc(max(env(safe-area-inset-top), 0px) + 72px)' }}
					>
						{/* Liens numérotés (le haut est occupé par la vraie navbar, passée au-dessus) */}
						<nav className="flex-1 flex flex-col justify-center gap-7 px-8">
							{menuLinks.map((link, index) => (
								<motion.a
									key={link.href}
									href={link.href}
									onClick={(event) => handleMenuLink(event, link.href)}
									initial={{ opacity: 0, y: 16 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 + index * 0.06 }}
									className="flex items-baseline gap-4"
								>
									<span className="text-white/30 text-xs tracking-[0.2em]">0{index + 1}</span>
									<span className="text-white font-landasans text-3xl tracking-widest uppercase">{link.label}</span>
								</motion.a>
							))}
						</nav>

						{/* Pied : Instagram */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.4, delay: 0.45 }}
							className="px-8 pb-10 pt-6 border-t border-white/10"
						>
							<a
								href="https://instagram.com/la.foret.performance"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
							>
								<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
								</svg>
								@la.foret.performance
								<span>↗</span>
							</a>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.div
				style={{ opacity: topGradientOpacity }}
				className="hidden md:block fixed top-0 left-0 right-0 h-24 md:h-28 bg-linear-to-b from-black via-black/80 to-transparent z-40 pointer-events-none"
			/>

			{/* Nav desktop : logo à gauche, liens à droite — le titre du hero vient s'accoster
			    au centre entre les deux au scroll (z-45 : au-dessus du dégradé, sous le titre). */}
			<motion.nav
				initial={{ y: -24, opacity: 0 }}
				animate={{ y: showNav ? 0 : -24, opacity: showNav ? 1 : 0 }}
				transition={{ duration: 0.6, ease: 'easeOut' }}
				className="hidden md:flex fixed top-0 left-0 right-0 z-45 items-center justify-between px-8 lg:px-12 py-5"
			>
				<a href="#hero" aria-label="Retour en haut">
					<Image
						src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/logo-lfp.jpg"
						alt="LFP"
						width={40}
						height={40}
						className="object-cover border border-white/15"
					/>
				</a>
				{/* Ancres de sections dès xl uniquement (sous xl, le titre accosté les chevaucherait) ;
				    le bloc est ancré à droite : une section qui apparaît/disparaît (ex. Sorties)
				    étend simplement la liste vers la gauche sans rien déplacer d'autre. */}
				<div className="flex items-center gap-6 xl:gap-8 text-xs uppercase tracking-[0.2em]">
					{menuLinks
						.filter((link) => link.href !== '#hero')
						.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className={`text-gray-400 hover:text-white transition-colors ${
									link.href === '/shop' ? '' : 'hidden xl:block'
								}`}
								style={{ textShadow: '0 1px 8px rgba(0, 0, 0, 0.8)' }}
							>
								{link.label}
							</a>
						))}
				</div>
			</motion.nav>

			<section
				id='hero'
				className="grain-bg relative h-screen flex items-center justify-center bg-[#1a1a1a]"
			>
				{/* Le clip du zoom d'intro vit ici (et non sur la section) pour ne pas clipper
				    le titre mobile fixed qui dépasse pendant son trajet. */}
				<div className="absolute inset-0 overflow-hidden">
				<motion.div
					initial={{ opacity: 0, scale: 1.1 }}
					animate={{
						opacity: showBackground ? 1 : 0,
						scale: showBackground ? 1 : 1.1
					}}
					transition={{ duration: 2, ease: 'easeOut' }}
					className="absolute inset-0"
				>
					<div className="md:hidden absolute inset-0">
						<Image
							src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/group/group-4.jpg"
							alt="La Forêt Performance"
							fill
							sizes="100vw"
							className="object-cover"
							priority
						/>
						<div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/50 to-black/70" />
						<div className="absolute inset-0 bg-linear-to-r from-black/40 via-transparent to-black/40" />
					</div>
					<div className="hidden md:block absolute inset-0">
						<Image
							src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/group/group-3.jpg"
							alt="La Forêt Performance"
							fill
							sizes="100vw"
							className="object-cover"
							priority
						/>
						<div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/50 to-black/70" />
						<div className="absolute inset-0 bg-linear-to-r from-black/40 via-transparent to-black/40" />
					</div>
				</motion.div>
				</div>

				{/* Titre mobile : scrub écrit chaque frame par la boucle rAF (voir effet plus haut).
				    Ancré top:0 (insensible au repli de la barre Safari) ; position initiale posée
				    en CSS identique au calcul JS pour éviter tout saut au montage. */}
				<div
					ref={mobileTitleRef}
					className="md:hidden fixed top-0 left-1/2 z-100 text-center px-4 pointer-events-none"
					style={{ transform: 'translateX(-50%) translateY(calc(50vh - 24px))', willChange: 'transform' }}
				>
					<div className="flex items-center justify-center gap-2">
						<motion.div
							initial={{ opacity: 0, scaleX: 0 }}
							animate={{ opacity: 1, scaleX: 1 }}
							transition={{ duration: 0.6, ease: 'easeOut' }}
							className="origin-right"
						>
							<span
								className="text-2xl text-white/40 font-light"
								style={{ textShadow: '0 0 20px rgba(0, 0, 0, 0.8)' }}
							>
								──
							</span>
						</motion.div>

						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.6, duration: 0.3 }}
						>
							<h1
								className="text-4xl font-landasans font-display text-white tracking-[0.2em] whitespace-nowrap"
								style={{ textShadow: '0 2px 20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.5)' }}
							>
								{displayText === fullText ? mobileText : displayText.slice(0, 3)}
								{displayText.length > 0 && displayText.length < 3 && !isTypingComplete && (
									<motion.span
										animate={{ opacity: [1, 0] }}
										transition={{ duration: 0.5, repeat: Infinity }}
										className="text-lfp-amber"
									>
										|
									</motion.span>
								)}
							</h1>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, scaleX: 0 }}
							animate={{ opacity: 1, scaleX: 1 }}
							transition={{ duration: 0.6, ease: 'easeOut' }}
							className="origin-left"
						>
							<span
								className="text-2xl text-white/40 font-light"
								style={{ textShadow: '0 0 20px rgba(0, 0, 0, 0.8)' }}
							>
								──
							</span>
						</motion.div>
					</div>
				</div>

				<motion.div
					style={{
						scale: titleScale,
						y: titleY,
						willChange: "transform"
					}}
					className="hidden md:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center px-4"
				>
					<div className="flex items-center justify-center gap-4">
						<motion.div
							initial={{ opacity: 0, scaleX: 0 }}
							animate={{ opacity: 1, scaleX: 1 }}
							transition={{ duration: 0.6, ease: 'easeOut' }}
							className="origin-right"
						>
							<span
								className="text-4xl lg:text-6xl text-white/40 font-light"
								style={{ textShadow: '0 0 20px rgba(0, 0, 0, 0.8)' }}
							>
								──
							</span>
						</motion.div>

						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.6, duration: 0.3 }}
							className="min-w-25"
						>
							<h1
								className="text-5xl font-landasans lg:text-7xl text-white tracking-[0.15em] whitespace-nowrap"
								style={{ textShadow: '0 2px 20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.5)' }}
							>
								{displayText}
								{displayText.length > 0 && !isTypingComplete && (
									<motion.span
										animate={{ opacity: [1, 0] }}
										transition={{ duration: 0.5, repeat: Infinity }}
										className="text-lfp-amber"
									>
										|
									</motion.span>
								)}
							</h1>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, scaleX: 0 }}
							animate={{ opacity: 1, scaleX: 1 }}
							transition={{ duration: 0.6, ease: 'easeOut' }}
							className="origin-left"
						>
							<span
								className="text-4xl lg:text-6xl text-white/40 font-light"
								style={{ textShadow: '0 0 20px rgba(0, 0, 0, 0.8)' }}
							>
								──
							</span>
						</motion.div>
					</div>
				</motion.div>

				{showScrollIndicator && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: 'easeOut' }}
						style={{ opacity: scrollIndicatorOpacity }}
						className="absolute bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2"
					>
						<div className="flex flex-col items-center gap-1.5">
							<span
								className="text-gray-400 text-[10px] md:text-xs uppercase tracking-widest font-light"
								style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.9)' }}
							>
								Scroll
							</span>
							{/* Chevron animé : plus lisible qu'une "souris" équarrie */}
							<motion.svg
								animate={{ y: [0, 6, 0] }}
								transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
								className="w-5 h-5 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
							</motion.svg>
						</div>
					</motion.div>
				)}

				<div className="grain" />
			</section>
		</>
	);
}
