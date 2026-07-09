'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SetupPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const isReset = searchParams.get('reset') === 'true';

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('Lien invalide');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/setup-password?token=${token}`);
        const data = await res.json();

        if (data.valid) {
          setIsValid(true);
          setUser(data.user);
        } else {
          setError(data.error || 'Lien invalide ou expiré');
        }
      } catch {
        setError('Erreur lors de la vérification');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erreur lors de la définition du mot de passe');
      }
    } catch {
      setError('Erreur lors de la définition du mot de passe');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-lfp-amber" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-none mb-6">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-display text-white mb-4">Mot de passe défini !</h1>
          <p className="text-gray-400 mb-8">
            Votre mot de passe a été défini avec succès. Vous pouvez maintenant vous connecter.
          </p>
          <Link
            href="/admin/login"
            className="inline-block px-6 py-3 bg-lfp-amber hover:bg-lfp-amber/90 text-black rounded-none transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-none mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-display text-white mb-4">Lien invalide</h1>
          <p className="text-gray-400 mb-8">
            {error || 'Ce lien est invalide ou a expiré. Contactez un administrateur pour obtenir un nouveau lien.'}
          </p>
          <Link
            href="/admin/login"
            className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-none transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-lfp-amber/10 rounded-none mb-4">
            <span className="text-2xl font-display text-lfp-amber">LFP</span>
          </div>
          <h1 className="text-2xl font-display text-white tracking-wider">
            {isReset ? 'Nouveau mot de passe' : 'Définir votre mot de passe'}
          </h1>
          {user && (
            <p className="text-gray-400 mt-2">
              Bienvenue <span className="text-lfp-amber">{user.name}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-[#141414] border border-white/10 rounded-none p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-none">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-none text-white placeholder-gray-600 focus:outline-none focus:border-lfp-amber transition-colors"
                placeholder="Minimum 8 caractères"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-none text-white placeholder-gray-600 focus:outline-none focus:border-lfp-amber transition-colors"
                placeholder="Répétez le mot de passe"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-white hover:bg-white/90 text-black cursor-pointer font-medium rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Définition...
                </span>
              ) : (
                'Définir mon mot de passe'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SetupPasswordFallback() {
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

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<SetupPasswordFallback />}>
      <SetupPasswordForm />
    </Suspense>
  );
}
