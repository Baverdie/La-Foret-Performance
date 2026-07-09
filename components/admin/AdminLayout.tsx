'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import AdminSidebar from './AdminSidebar';
import Providers from './Providers';

function WelcomeLoader({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3300);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 loader-container">
      <style jsx>{`
        @keyframes drawPath {
          from {
            stroke-dashoffset: 1;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes garageDoor {
          to {
            transform: translateY(-100%);
          }
        }

        .loader-container {
          animation: garageDoor 0.8s ease-in-out 2.5s forwards;
        }

        .logo-path {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: drawPath 2.5s ease-out forwards;
        }
      `}</style>
      <svg
        width="250"
        height="330"
        viewBox="-20 -40 640 860"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="logo-path"
          pathLength="1"
          d="M14.0697 317.711C14.0697 317.711 86.5696 273.211 146.57 165.211C206.57 57.2109 199.07 11.7108 199.07 11.7108C186.07 -39.2892 105.651 96.3368 66.5697 165.211C27.9602 233.254 9.56976 287.711 2.56978 352.211C-4.43019 416.711 8.56974 428.711 8.56974 428.711C41.0698 463.711 157.57 379.711 157.57 379.711C157.57 379.711 273.07 272.211 309.07 202.711C345.07 133.211 362.854 77.2109 355.57 28.2108C342.07 -17.2891 252.07 210.711 252.07 210.711C252.07 210.711 176.57 389.211 104.57 637.711C75.0698 757.711 100.07 787.711 100.07 787.711C132.57 814.711 186.07 717.711 186.07 717.711C239.57 637.711 260.07 543.211 260.07 462.211C260.07 381.211 250.57 382.711 239.57 364.211C228.57 345.711 186.07 326.211 186.07 326.211C186.07 326.211 211.07 373.991 288.57 346.711C365.07 326.211 389.745 320.711 389.745 320.711L407.57 271.711L280.57 629.211C280.57 629.211 340.57 400.711 437.57 316.211C523.57 247.211 490.57 336.211 490.57 336.211C472.07 395.711 426.57 395.711 426.57 395.711C534.07 342.711 605.07 342.711 605.07 342.711"
          stroke="white"
          fill="none"
          strokeWidth="40"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function MobileBlocker() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-lfp-amber/20 rounded-none flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-lfp-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-display text-white mb-3">Version desktop requise</h2>
        <p className="text-gray-400 mb-6">
          Cette section du panel admin n&apos;est accessible que sur ordinateur. Utilisez le dashboard pour voir les statistiques.
        </p>
        <a
          href="/admin"
          className="inline-block px-6 py-3 bg-lfp-amber text-black rounded-none hover:bg-lfp-amber/90 transition-colors"
        >
          Retour au dashboard
        </a>
      </div>
    </div>
  );
}

function MobileHeader() {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-[#1a1a1a] border-b border-white/10 p-4 z-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Image
          src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/logo-lfp.jpg"
          alt="LFP"
          width={32}
          height={32}
          className="rounded-none object-cover border border-white/20"
        />
        <span className="text-white font-medium">Admin</span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/admin/login' })}
        className="p-2 text-red-400 hover:bg-red-500/10 rounded-none transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isDashboard = pathname === '/admin';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-lfp-amber" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <>
      <div className="md:hidden">
        {isDashboard ? (
          <div className="min-h-screen bg-[#0a0a0a]">
            <MobileHeader />
            <main className="pt-24 p-4">
              {children}
            </main>
          </div>
        ) : (
          <MobileBlocker />
        )}
      </div>

      <div className="hidden md:block min-h-screen bg-[#0a0a0a]">
        <AdminSidebar />
        <main className="ml-64 min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true') {
      sessionStorage.removeItem('justLoggedIn');
      setShowWelcome(true);
    }
  }, []);

  if (showWelcome) {
    return <WelcomeLoader onComplete={() => setShowWelcome(false)} />;
  }

  return (
    <Providers>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Providers>
  );
}
