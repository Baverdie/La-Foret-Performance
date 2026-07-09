'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/permissions';

interface NavItem {
	label: string;
	href: string;
	icon: React.ReactNode;
	permission?: Permission;
}

const navItems: NavItem[] = [
	{
		label: 'Dashboard',
		href: '/admin',
		icon: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard-icon lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
		),
	},
	{
		label: 'Membres',
		href: '/admin/membres',
		icon: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-icon lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
		),
		permission: PERMISSIONS.MEMBERS_VIEW,
	},
	{
		label: 'Voitures',
		href: '/admin/voitures',
		icon: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-car-icon lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
		),
		permission: PERMISSIONS.CARS_VIEW,
	},
	{
		label: 'Événements',
		href: '/admin/events',
		icon: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-icon lucide-calendar"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
		),
		permission: PERMISSIONS.EVENTS_VIEW,
	},
	{
		label: 'Boutique',
		href: '/admin/boutique',
		icon: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-bag"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
		),
		permission: PERMISSIONS.PRODUCTS_VIEW,
	},
	{
		label: 'Commandes',
		href: '/admin/commandes',
		icon: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-receipt"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" /></svg>
		),
		permission: PERMISSIONS.ORDERS_VIEW,
	},
	{
		label: 'Précommandes',
		href: '/admin/precommandes',
		icon: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-package"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
		),
		permission: PERMISSIONS.CAMPAIGNS_VIEW,
	},
	{
		label: 'Utilisateurs',
		href: '/admin/utilisateurs',
		icon: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-cog-icon lucide-user-cog"><path d="M10 15H6a4 4 0 0 0-4 4v2" /><path d="m14.305 16.53.923-.382" /><path d="m15.228 13.852-.923-.383" /><path d="m16.852 12.228-.383-.923" /><path d="m16.852 17.772-.383.924" /><path d="m19.148 12.228.383-.923" /><path d="m19.53 18.696-.382-.924" /><path d="m20.772 13.852.924-.383" /><path d="m20.772 16.148.924.383" /><circle cx="18" cy="15" r="3" /><circle cx="9" cy="7" r="4" /></svg>
		),
		permission: PERMISSIONS.USERS_VIEW,
	},
	{
		label: 'Logs',
		href: '/admin/logs',
		icon: (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-clock-icon lucide-clipboard-clock"><path d="M16 14v2.2l1.6 1" /><path d="M16 4h2a2 2 0 0 1 2 2v.832" /><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" /><circle cx="16" cy="16" r="6" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
		),
		permission: PERMISSIONS.LOGS_VIEW,
	},
];

export default function AdminSidebar() {
	const pathname = usePathname();
	const { data: session } = useSession();
	const userPermissions = session?.user?.permissions || [];

	const filteredNavItems = navItems.filter(
		(item) => !item.permission || hasPermission(userPermissions, item.permission)
	);

	return (
		<aside className="fixed left-0 top-0 h-full w-64 bg-[#1a1a1a] border-r border-white/10 flex flex-col z-50">
			{/* Header */}
			<div className="p-6 border-b border-white/10">
				<Link href="/admin" className="flex items-center gap-3">
					<Image
						src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/logo-lfp.jpg"
						alt="LFP"
						width={40}
						height={40}
						className="rounded-none object-cover border border-white/20"
					/>
					<div>
						<h1 className="text-white font-medium">Admin Panel</h1>
						<p className="text-xs text-gray-500">La Forêt Performance</p>
					</div>
				</Link>
			</div>

			{/* Navigation */}
			<nav className="flex-1 p-4 space-y-1 overflow-y-auto">
				{filteredNavItems.map((item) => {
				const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

					return (
						<Link
						key={item.href}
						href={item.href}
						className={`flex items-center gap-3 px-4 py-3 rounded-none transition-all duration-200 ${isActive
							? 'bg-white/20 text-white'
							: 'text-gray-400 hover:text-white hover:bg-white/5'
							}`}
						>
							{item.icon}
							<span className="font-medium">{item.label}</span>
						</Link>
					);
				})}
			</nav>

			{/* User Section */}
			<div className="p-4 border-t border-white/10">
				<div className="flex items-center gap-3 mb-4">
					{session?.user?.memberPhoto ? (
						<div className="relative w-10 h-10 rounded-none overflow-hidden">
							<Image
								src={session.user.memberPhoto}
								alt={session.user.name || 'Photo membre'}
								fill
								sizes="40px"
								className="object-cover"
							/>
						</div>
					) : (
						<div className="w-10 h-10 bg-white/10 rounded-none flex items-center justify-center">
							<span className="text-sm text-white font-medium">
								{session?.user?.name?.charAt(0).toUpperCase() || 'U'}
							</span>
						</div>
					)}
					<div className="flex-1 min-w-0">
						<p className="text-white text-sm font-medium truncate">{session?.user?.name}</p>
						<p className="text-gray-500 text-xs truncate">{session?.user?.role}</p>
					</div>
				</div>
				<button
					onClick={() => signOut({ callbackUrl: '/admin/login' })}
					className="w-full flex items-center justify-start gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-none transition-all duration-200 ease-in-out cursor-pointer"
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
					<span>Déconnexion</span>
				</button>
			</div>
		</aside>
	);
}
