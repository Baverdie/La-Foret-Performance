'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface Stats {
	members: number;
	cars: number;
	events: number;
	users: number;
}

function DashboardContent() {
	const { data: session } = useSession();
	const [stats, setStats] = useState<Stats | null>(null);
	const [recentLogs, setRecentLogs] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [statsRes, logsRes] = await Promise.all([
					fetch('/api/admin/stats'),
					fetch('/api/admin/logs?limit=5'),
				]);

				if (statsRes.ok) {
					const statsData = await statsRes.json();
					setStats(statsData);
				}

				if (logsRes.ok) {
					const logsData = await logsRes.json();
					setRecentLogs(logsData.logs || []);
				}
			} catch (error) {
				console.error('Error fetching dashboard data:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	const statCards = [
		{ label: 'Membres', value: stats?.members || 0, icon: '👥', color: 'bg-blue-500/20 text-blue-400' },
		{ label: 'Voitures', value: stats?.cars || 0, icon: '🚗', color: 'bg-green-500/20 text-green-400' },
		{ label: 'Événements', value: stats?.events || 0, icon: '📅', color: 'bg-purple-500/20 text-purple-400' },
		{ label: 'Admin', value: stats?.users || 0, icon: '👤', color: 'bg-orange-500/20 text-orange-400' },
	];

	return (
		<div>
			{/* Header */}
			<div className="mb-6 md:mb-8">
				<h1 className="text-6xl md:text-7xl font-display tracking-wide text-white mb-2">Dashboard</h1>
				<p className="text-gray-400 text-sm md:text-base">
					Bienvenue, <span className="text-lfp-amber">{session?.user?.name}</span>
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
				{statCards.map((stat) => (
					<div
						key={stat.label}
						className="bg-[#141414] border border-white/10 rounded-none p-3 md:p-4"
					>
						<div className="flex flex-col items-start p-2 md:p-3 justify-center gap-1">
							<span className="text-3xl md:text-5xl font-bold">
								{isLoading ? '...' : stat.value}
							</span>
							<span className="text-white text-sm md:text-base font-medium">{stat.label}</span>
						</div>
					</div>
				))}
			</div>

			{/* Message mobile */}
			<div className="md:hidden bg-[#141414] border border-white/10 rounded-none p-4 mb-6">
				<div className="flex items-start gap-3">
					<div className="w-10 h-10 bg-lfp-amber/20 rounded-none flex items-center justify-center shrink-0">
						<svg className="w-5 h-5 text-lfp-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</div>
					<div>
						<p className="text-white font-medium text-sm">Version desktop requise</p>
						<p className="text-gray-400 text-xs mt-1">
							Pour gérer le contenu (membres, voitures, événements), connectez-vous depuis un ordinateur.
						</p>
					</div>
				</div>
			</div>

			{/* Quick Actions & Recent Activity - Desktop only */}
			<div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Quick Actions */}
				<div className="bg-[#141414] border border-white/10 rounded-none p-6">
					<h2 className="text-xl font-display text-white mb-6">Actions rapides</h2>
					<div className="space-y-3">
						<a
							href="/admin/membres"
							className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-none transition-colors"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
							<span className="text-white">Ajouter un membre</span>
						</a>
						<a
							href="/admin/voitures"
							className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-none transition-colors"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
							<span className="text-white">Ajouter une voiture</span>
						</a>
						<a
							href="/admin/events"
							className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-none transition-colors"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
							<span className="text-white">Créer un événement</span>
						</a>
					</div>
				</div>

				{/* Recent Activity */}
				<div className="bg-[#141414] border border-white/10 rounded-none p-6">
					<h2 className="text-xl font-display text-white mb-6">Activité récente</h2>
					{isLoading ? (
						<p className="text-gray-500">Chargement...</p>
					) : recentLogs.length === 0 ? (
						<p className="text-gray-500">Aucune activité récente</p>
					) : (
						<div className="space-y-4">
							{recentLogs.map((log) => (
								<div key={log.id} className="flex items-start gap-3 text-sm">
									<div className="w-2 h-2 bg-lfp-amber rounded-full mt-1.5 shrink-0" />
									<div>
										<p className="text-white">
											<span className="text-gray-400">{log.user?.name}</span> a {log.action.toLowerCase()} un {log.entity.toLowerCase()}
										</p>
										<p className="text-gray-500 text-xs">
											{new Date(log.createdAt).toLocaleString('fr-FR')}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Permissions Info
			<div className="mt-8 bg-[#141414] border border-white/10 rounded-none p-6">
				<h2 className="text-xl font-display text-white mb-4">Vos permissions</h2>
				<div className="flex flex-wrap gap-2">
					{session?.user?.permissions?.map((permission) => (
						<span
							key={permission}
							className="px-3 py-1 bg-lfp-amber/10 text-lfp-amber text-xs rounded-none"
						>
							{permission}
						</span>
					))}
				</div>
			</div> */}
		</div>
	);
}

export default function AdminDashboardPage() {
	return (
		<AdminLayout>
			<DashboardContent />
		</AdminLayout>
	);
}
