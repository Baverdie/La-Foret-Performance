'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { PublicMember } from '@/lib/data';

function MemberModal({
	member,
	onClose,
	onOpenCar,
}: {
	member: PublicMember;
	onClose: () => void;
	onOpenCar?: (carId: string) => void;
}) {
	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
			className="fixed inset-0 z-200 bg-[#0a0a0a] flex items-center justify-center p-4"
		>
			<div className='relative h-full w-full'>
				<motion.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.95, opacity: 0 }}
					transition={{ duration: 0.3 }}
					onClick={(e) => e.stopPropagation()}
					className="relative w-full max-w-5xl max-h-[90vh] mx-auto overflow-y-auto bg-linear-to-b from-[#141414] to-[#0a0a0a] rounded-none"
				>
					<button
						onClick={onClose}
						className="absolute top-2 right-2 md:top-8 md:right-8 z-220 w-10 h-10 md:w-12 md:h-12 rounded-none bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 cursor-pointer"
					>
						<svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					<div className="p-6 md:pt-24 md:p-12">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}
							className="mb-8 md:mb-12 text-center"
						>
							<div className="mx-auto mb-4 md:mb-6 w-20 h-20 md:w-28 md:h-28 rounded-none overflow-hidden border border-white/30 bg-black/40 backdrop-blur-sm">
								<Image
									src={member.photo}
									alt={member.name}
									fill
									sizes="112px"
									className="object-cover"
								/>
							</div>
							<h2 className="text-4xl md:text-6xl font-display text-white mb-3">{member.name}</h2>
							<p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto mb-6">{member.bio}</p>
							<a
								href={`https://instagram.com/${member.instagram}`}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 px-6 rounded-none transition-all duration-300 hover:scale-105"
							>
								<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
								</svg>
								<span>@{member.instagram}</span>
							</a>
						</motion.div>

						<div className="w-16 h-px bg-white/30 mx-auto mb-8 md:mb-12" />

						<div>
							<motion.h3
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
								className="text-2xl md:text-3xl font-display text-white mb-8 text-center"
							>
								{member.cars.length > 1 ? 'Ses bolides' : 'Son bolide'} ({member.cars.length})
							</motion.h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{member.cars.map((car, index) => (
									<motion.div
										key={car.id}
										initial={{ opacity: 0, y: 30 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.3 + index * 0.1 }}
										onClick={(e) => {
											e.stopPropagation();
											document.body.style.overflow = 'unset';
											onClose();
											window.setTimeout(() => {
												onOpenCar?.(car.id);
											}, 120);
										}}
										className="relative bg-linear-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-none overflow-hidden border border-white/20 group hover:border-white/50 transition-all duration-500 cursor-pointer"
									>
										<div className="relative h-64 overflow-hidden">
											<Image
												src={car.photos[0]}
												alt={`${car.model} photo 1`}
												fill
												sizes="(max-width: 768px) 100vw, 50vw"
												className="object-cover group-hover:scale-110 transition-transform duration-700"
											/>
										</div>

										<div className="p-6">
											<h4 className="text-2xl md:text-3xl font-display text-white mb-2">{car.model}</h4>
											<p className="text-xl text-lfp-amber mb-4">{car.year}</p>
											<div className="space-y-2">
												<div className="flex justify-between items-center">
													<span className="text-white/50 text-sm">Moteur</span>
													<span className="text-white font-light">{car.engine}</span>
												</div>
												<div className="flex justify-between items-center">
													<span className="text-white/50 text-sm">Puissance</span>
													<span className="text-white font-light">{car.power}</span>
												</div>
											</div>
										</div>
									</motion.div>
								))}
							</div>
						</div>
					</div>
				</motion.div >
			</div>
		</motion.div >
	);
}

function isNewMember(createdAt: string): boolean {
	const created = new Date(createdAt);
	const oneMonthAgo = new Date();
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
	return created > oneMonthAgo;
}

interface CrewProps {
	members: PublicMember[];
	selectedMember?: PublicMember | null;
	onSelectMember?: (member: PublicMember) => void;
	onCloseMember?: () => void;
	onOpenCar?: (carId: string) => void;
}

export default function Crew({
	members,
	selectedMember: controlledSelectedMember,
	onSelectMember,
	onCloseMember,
	onOpenCar,
}: CrewProps) {
	const [internalSelectedMember, setInternalSelectedMember] = useState<PublicMember | null>(null);
	const selectedMember = controlledSelectedMember ?? internalSelectedMember;
	const handleSelect = onSelectMember ?? setInternalSelectedMember;
	const handleClose = onCloseMember ?? (() => setInternalSelectedMember(null));
	const [ref, inView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
	});

	return (
		<section id="crew" className="grain-bg relative py-16 md:py-32 px-4 md:px-6 lg:px-12 bg-[#0a0a0a] overflow-hidden">
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.8 }}
				className="mb-12 md:mb-20 text-center"
			>
				<div className="flex items-center justify-center gap-2 md:gap-4 mb-6 md:mb-8">
					<span className="text-xl md:text-2xl lg:text-3xl font-light text-white/40">──</span>
					<h2 className="text-4xl md:text-5xl lg:text-7xl font-landasans text-white tracking-widest">LE CREW</h2>
					<span className="text-xl md:text-2xl lg:text-3xl font-light text-white/40">──</span>
				</div>
				<p className="text-gray-400 text-base md:text-xl">Les passionnés qui font vivre LFP</p>
			</motion.div>

			<div ref={ref} className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
				{members.map((member, index) => (
					<motion.div
						key={member.id}
						id={`member-${member.id}`}
						initial={{ opacity: 0, y: 40 }}
						animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
						transition={{ duration: 0.6, delay: index * 0.1 }}
						onClick={() => handleSelect(member)}
						className="relative aspect-square rounded-none overflow-hidden cursor-pointer group"
					>
						<Image
							src={member.photo}
							alt={member.name}
							fill
							sizes="(max-width: 768px) 100vw, 33vw"
							className="object-cover group-hover:scale-110 transition-transform duration-700"
						/>

						<div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

						{isNewMember(member.createdAt) && (
							<div className="absolute top-3 left-3 bg-lfp-amber text-black text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-none">
								Nouveau
							</div>
						)}

						<div className="absolute bottom-4 left-4 right-4">
							<h3 className="text-xl md:text-2xl font-display text-white group-hover:text-lfp-amber transition-colors">
								{member.name}
							</h3>
							<p className="text-sm text-gray-400">{member.cars.length} {member.cars.length > 1 ? 'voitures' : 'voiture'}</p>
						</div>

						<div className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
							<svg className="w-4 h-4 text-lfp-amber drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
						</div>
					</motion.div>
				))}
			</div>

			<AnimatePresence>
				{selectedMember && (
					<MemberModal member={selectedMember} onClose={handleClose} onOpenCar={onOpenCar} />
				)}
			</AnimatePresence>
		</section>
	);
}
