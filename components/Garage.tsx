'use client';

import { motion, AnimatePresence, easeInOut } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { PublicCar } from '@/lib/data';

function CarModal({
	car,
	onClose,
	onOpenOwner,
}: {
	car: PublicCar;
	onClose: () => void;
	onOpenOwner?: (ownerInstagram: string, ownerName: string) => void;
}) {
	const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
	const [progress, setProgress] = useState(0);
	const AUTO_SCROLL_DURATION = 10000;

	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, []);

	useEffect(() => {
		if (car.photos.length <= 1) return;
		setProgress(0);
		const startTime = performance.now();
		let animationFrameId: number;

		const animate = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			const newProgress = Math.min((elapsed / AUTO_SCROLL_DURATION) * 100, 100);
			setProgress(newProgress);
			if (elapsed < AUTO_SCROLL_DURATION) {
				animationFrameId = requestAnimationFrame(animate);
			} else {
				setCurrentPhotoIndex((prev) => (prev + 1) % car.photos.length);
			}
		};

		animationFrameId = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(animationFrameId);
	}, [car.photos.length, currentPhotoIndex]);

	const nextPhoto = () => {
		setCurrentPhotoIndex((prev) => (prev + 1) % car.photos.length);
	};

	const prevPhoto = () => {
		setCurrentPhotoIndex((prev) => (prev - 1 + car.photos.length) % car.photos.length);
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
			className="fixed inset-0 z-200 bg-[#0a0a0a] flex items-center justify-center"
		>
			<button
				onClick={onClose}
				className="fixed top-4 right-4 md:top-8 md:right-8 z-220 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 cursor-pointer"
			>
				<svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<motion.div
				initial={{ scale: 0.98, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.98, opacity: 0 }}
				transition={{ duration: 0.3, ease: easeInOut }}
				onClick={(e) => e.stopPropagation()}
				className="relative w-full h-full max-w-450 mx-auto flex flex-col md:flex-row"
			>
				<div className="relative w-full md:w-[60%] h-[50vh] md:h-full bg-black group/photo">
					{car.photos.length > 1 && (
						<div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20">
							<div className="h-full bg-white" style={{ width: `${progress}%` }} />
						</div>
					)}

					<motion.a
						href={`https://instagram.com/${car.ownerInstagram}`}
						target="_blank"
						rel="noopener noreferrer"
						whileHover={{ scale: 1.05 }}
						className="absolute top-4 left-4 md:top-6 md:left-auto md:right-6 z-30 md:opacity-0 md:group-hover/photo:opacity-100 transition-all duration-300 inline-flex items-center gap-2 md:gap-3 bg-black/80 backdrop-blur-md border border-white/20 hover:border-white text-white py-2 px-4 md:py-3 md:px-5 rounded-full text-sm"
						onClick={(e) => e.stopPropagation()}
					>
						<svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
						</svg>
						<span className="font-light">@{car.ownerInstagram}</span>
					</motion.a>

					<div className="relative w-full h-full">
						<AnimatePresence>
							<motion.div
								key={currentPhotoIndex}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.8, ease: easeInOut }}
								className="absolute inset-0"
							>
								<Image
									src={car.photos[currentPhotoIndex]}
									alt={`${car.model} - ${currentPhotoIndex + 1}`}
									fill
									sizes="(max-width: 768px) 100vw, 60vw"
									quality={90}
									className={car.containPhotos.includes(currentPhotoIndex) ? "object-contain" : "object-cover"}
									priority
								/>
							</motion.div>
						</AnimatePresence>
					</div>

					{car.photos.length > 1 && (
						<>
							<button
								onClick={prevPhoto}
								className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
							>
								<svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
							</button>
							<button
								onClick={nextPhoto}
								className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
							>
								<svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</>
					)}

					{car.photos.length > 1 && (
						<div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
							{car.photos.map((_, index) => (
								<button
									key={index}
									onClick={() => setCurrentPhotoIndex(index)}
									className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${index === currentPhotoIndex ? 'bg-white w-6 md:w-8' : 'bg-white/30 w-1.5 md:w-2 hover:bg-white/50'
										}`}
								/>
							))}
						</div>
					)}
				</div>

				<div className="w-full md:w-[40%] h-[50vh] md:h-full p-6 md:p-12 overflow-y-auto bg-linear-to-b from-[#141414] to-[#0a0a0a]">
					<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="mb-8 md:mb-12">
						<h2 className="text-4xl md:text-6xl font-display text-white mb-3 md:mb-4 tracking-wider leading-tight">{car.model}</h2>
						<p className="text-2xl md:text-3xl text-lfp-green font-light">{car.year}</p>
					</motion.div>

					<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="mb-8 md:mb-12">
						<div className="w-12 h-px bg-white/30 mb-4 md:mb-6" />
						<p className="text-gray-300 text-base md:text-lg leading-relaxed">{car.story}</p>
					</motion.div>

					<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="mb-8 md:mb-12">
						<h3 className="text-white/40 text-xs uppercase tracking-[0.3em] mb-6 md:mb-8 font-light">Spécifications</h3>
						<div className="space-y-4 md:space-y-6">
							<div>
								<span className="text-white/50 text-xs md:text-sm block mb-2">Moteur</span>
								<span className="text-white text-xl md:text-2xl font-light">{car.engine}</span>
							</div>
							<div>
								<span className="text-white/50 text-xs md:text-sm block mb-2">Puissance</span>
								<span className="text-white text-xl md:text-2xl font-light">{car.power}</span>
							</div>
							<div>
								<span className="text-white/50 text-xs md:text-sm block mb-2">Modifications</span>
								<span className="text-white text-lg md:text-xl font-light whitespace-pre-line">{car.modifications}</span>
							</div>
						</div>
					</motion.div>

					<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="mt-2">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								document.body.style.overflow = 'unset';
								onClose();
								window.setTimeout(() => {
									onOpenOwner?.(car.ownerInstagram, car.owner);
								}, 120);
							}}
							className="w-full inline-flex items-center justify-between gap-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-4 md:px-5 py-4 transition-all duration-300 cursor-pointer"
						>
							<div className="text-left">
								<span className="text-white/50 text-xs uppercase tracking-[0.3em] block mb-1">Propriétaire</span>
								<span className="text-white text-lg md:text-xl font-light">{car.owner}</span>
							</div>
							<div className="w-9 h-9 rounded-full bg-lfp-green/20 backdrop-blur-md bg-zinc-500/10 flex items-center justify-center">
								<svg className="w-4 h-4 text-lfp-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</div>
						</button>
					</motion.div>
				</div>
			</motion.div>
		</motion.div>
	);
}

interface GarageProps {
	cars: PublicCar[];
	onOpenOwner?: (ownerInstagram: string, ownerName: string) => void;
	selectedCar?: PublicCar | null;
	onSelectCar?: (car: PublicCar) => void;
	onCloseCar?: () => void;
}

export default function Garage({
	cars,
	onOpenOwner,
	selectedCar: controlledSelectedCar,
	onSelectCar,
	onCloseCar,
}: GarageProps) {
	const [internalSelectedCar, setInternalSelectedCar] = useState<PublicCar | null>(null);
	const selectedCar = controlledSelectedCar ?? internalSelectedCar;
	const handleSelect = onSelectCar ?? setInternalSelectedCar;
	const handleClose = onCloseCar ?? (() => setInternalSelectedCar(null));
	const [ref, inView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
	});

	const patterns = [];
	for (let i = 0; i < cars.length; i += 6) {
		patterns.push(cars.slice(i, Math.min(i + 6, cars.length)));
	}

	return (
		<section id="garage" className="grain-bg relative py-16 md:py-32 px-4 md:px-6 lg:px-12 bg-[#1a1a1a] overflow-hidden">
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.8 }}
				className="mb-12 md:mb-20 text-center"
			>
				<div className="flex items-center justify-center gap-2 md:gap-4 mb-6 md:mb-8">
					<span className="text-xl md:text-2xl lg:text-3xl font-light">──</span>
					<h2 className="text-4xl md:text-5xl lg:text-7xl font-landasans text-white tracking-widest">LE GARAGE</h2>
					<span className="text-xl md:text-2xl lg:text-3xl font-light">──</span>
				</div>
				<p className="text-gray-400 text-base md:text-xl">Les bolides du crew</p>
			</motion.div>

			<div ref={ref} className="max-w-7xl mx-auto space-y-4 md:space-y-6">
				{patterns.map((patternCars, patternIndex) => (
					<div key={patternIndex} className="space-y-4 md:space-y-6">
						{patternCars[0] && (
							<motion.div
								initial={{ opacity: 0, y: 40 }}
								animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
								transition={{ duration: 0.6, delay: patternIndex * 6 * 0.1 }}
								id={`car-${patternCars[0].id}`}
								className="relative w-full h-[40vh] md:h-[50vh] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
								onClick={() => handleSelect(patternCars[0])}
							>
								<Image
									src={patternCars[0].photos[0]}
									alt={patternCars[0].model}
									fill
									sizes="(max-width: 768px) 100vw, 80vw"
									quality={90}
									className="object-cover group-hover:scale-105 transition-transform duration-700"
								/>
								<div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
								<div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
									<h3 className="text-2xl md:text-4xl font-display text-white mb-1 md:mb-2">{patternCars[0].model}</h3>
									<p className="text-base md:text-xl text-lfp-green">{patternCars[0].year}</p>
								</div>
								<div className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-lfp-green/20 backdrop-blur-md bg-zinc-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<svg className="w-5 h-5 md:w-6 md:h-6 text-lfp-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
									</svg>
								</div>
							</motion.div>
						)}

						{(patternCars[1] || patternCars[2]) && (
							<motion.div
								initial={{ opacity: 0, y: 40 }}
								animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
								transition={{ duration: 0.6, delay: (patternIndex * 6 + 1) * 0.1 }}
								className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
							>
								{patternCars[1] && (
									<div
										className="relative h-[35vh] md:h-[40vh] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
										id={`car-${patternCars[1].id}`}
										onClick={() => handleSelect(patternCars[1])}
									>
										<Image
											src={patternCars[1].photos[0]}
											alt={patternCars[1].model}
											fill
											sizes="(max-width: 768px) 100vw, 40vw"
											className="object-cover group-hover:scale-105 transition-transform duration-700"
										/>
										<div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
										<div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
											<h3 className="text-xl md:text-3xl font-display text-white mb-1">{patternCars[1].model}</h3>
											<p className="text-sm md:text-lg text-lfp-green">{patternCars[1].year}</p>
										</div>
										<div className="absolute top-4 right-4 md:top-5 md:right-5 w-9 h-9 md:w-10 md:h-10 rounded-full bg-lfp-green/20 backdrop-blur-md bg-zinc-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
											<svg className="w-4 h-4 md:w-5 md:h-5 text-lfp-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
											</svg>
										</div>
									</div>
								)}
								{patternCars[2] && (
									<div
										className="relative h-[35vh] md:h-[40vh] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
										id={`car-${patternCars[2].id}`}
										onClick={() => handleSelect(patternCars[2])}
									>
										<Image
											src={patternCars[2].photos[0]}
											alt={patternCars[2].model}
											fill
											sizes="(max-width: 768px) 100vw, 40vw"
											className="object-cover group-hover:scale-105 transition-transform duration-700"
										/>
										<div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
										<div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
											<h3 className="text-xl md:text-3xl font-display text-white mb-1">{patternCars[2].model}</h3>
											<p className="text-sm md:text-lg text-lfp-green">{patternCars[2].year}</p>
										</div>
										<div className="absolute top-4 right-4 md:top-5 md:right-5 w-9 h-9 md:w-10 md:h-10 rounded-full bg-lfp-green/20 backdrop-blur-md bg-zinc-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
											<svg className="w-4 h-4 md:w-5 md:h-5 text-lfp-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
											</svg>
										</div>
									</div>
								)}
							</motion.div>
						)}

						{(patternCars[3] || patternCars[4] || patternCars[5]) && (
							<motion.div
								initial={{ opacity: 0, y: 40 }}
								animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
								transition={{ duration: 0.6, delay: (patternIndex * 6 + 3) * 0.1 }}
								className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
							>
								<div className="space-y-4 md:space-y-6">
									{patternCars[3] && (
										<div
											className="relative h-[30vh] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
											id={`car-${patternCars[3].id}`}
											onClick={() => handleSelect(patternCars[3])}
										>
											<Image
												src={patternCars[3].photos[0]}
												alt={patternCars[3].model}
												fill
												sizes="(max-width: 768px) 100vw, 40vw"
												className="object-cover group-hover:scale-105 transition-transform duration-700"
											/>
											<div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
											<div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
												<h3 className="text-lg md:text-2xl font-display text-white mb-1">{patternCars[3].model}</h3>
												<p className="text-sm md:text-lg text-lfp-green">{patternCars[3].year}</p>
											</div>
											<div className="absolute top-4 right-4 md:top-5 md:right-5 w-9 h-9 md:w-10 md:h-10 rounded-full bg-lfp-green/20 backdrop-blur-md bg-zinc-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
												<svg className="w-4 h-4 md:w-5 md:h-5 text-lfp-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
												</svg>
											</div>
										</div>
									)}
									{patternCars[4] && (
										<div
											className="relative h-[30vh] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
											id={`car-${patternCars[4].id}`}
											onClick={() => handleSelect(patternCars[4])}
										>
											<Image
												src={patternCars[4].photos[0]}
												alt={patternCars[4].model}
												fill
												sizes="(max-width: 768px) 100vw, 40vw"
												className="object-cover group-hover:scale-105 transition-transform duration-700"
											/>
											<div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
											<div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
												<h3 className="text-lg md:text-2xl font-display text-white mb-1">{patternCars[4].model}</h3>
												<p className="text-sm md:text-lg text-lfp-green">{patternCars[4].year}</p>
											</div>
											<div className="absolute top-4 right-4 md:top-5 md:right-5 w-9 h-9 md:w-10 md:h-10 rounded-full bg-lfp-green/20 backdrop-blur-md bg-zinc-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
												<svg className="w-4 h-4 md:w-5 md:h-5 text-lfp-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
												</svg>
											</div>
										</div>
									)}
								</div>
								{patternCars[5] && (
									<div
										className="relative h-[30vh] md:h-full rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
										id={`car-${patternCars[5].id}`}
										onClick={() => handleSelect(patternCars[5])}
									>
										<Image
											src={patternCars[5].photos[0]}
											alt={patternCars[5].model}
											fill
											sizes="(max-width: 768px) 100vw, 40vw"
											className="object-cover group-hover:scale-105 transition-transform duration-700"
										/>
										<div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
										<div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
											<h3 className="text-xl md:text-3xl font-display text-white mb-1 md:mb-2">{patternCars[5].model}</h3>
											<p className="text-base md:text-xl text-lfp-green">{patternCars[5].year}</p>
										</div>
										<div className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-lfp-green/20 backdrop-blur-md bg-zinc-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
											<svg className="w-5 h-5 md:w-6 md:h-6 text-lfp-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
											</svg>
										</div>
									</div>
								)}
							</motion.div>
						)}
					</div>
				))}
			</div>

			<AnimatePresence>
				{selectedCar && (
					<CarModal
						car={selectedCar}
						onClose={handleClose}
						onOpenOwner={onOpenOwner}
					/>
				)}
			</AnimatePresence>
		</section>
	);
}
