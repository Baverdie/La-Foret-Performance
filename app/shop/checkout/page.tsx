'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/shop/CartProvider';
import AddressAutocomplete, { type SelectedAddress } from '@/components/shop/AddressAutocomplete';
import { formatEuros } from '@/lib/shop/format';
import { computeShippingCost } from '@/lib/shop/shipping';

// Etat du formulaire de coordonnees client.
interface FormState {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
}

const INITIAL_FORM: FormState = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  city: '',
  country: 'France',
};

// Champ de saisie reutilisable du formulaire de checkout.
function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  full = false,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (name: keyof FormState, value: string) => void;
  type?: string;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-gray-400 text-xs mb-1.5">
        {label} {required && <span className="text-lfp-amber">*</span>}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(name, event.target.value)}
        className="w-full bg-[#0a0a0a] border border-white/10 rounded-none px-4 py-3 text-white text-sm focus:border-lfp-amber focus:outline-none transition-colors"
      />
    </div>
  );
}

// Page checkout : collecte des coordonnees puis redirection vers Stripe Checkout.
export default function CheckoutPage() {
  const { items, subtotal, hydrated } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = computeShippingCost(subtotal);
  const total = subtotal + shipping;

  // Met a jour un champ du formulaire.
  const handleChange = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Soumet la commande : appelle l'API checkout et redirige vers l'URL Stripe.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          customer: {
            email: form.email,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            postalCode: form.postalCode,
            city: form.city,
            country: form.country,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      // Redirection vers la page de paiement hebergee par Stripe.
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setSubmitting(false);
    }
  };

  if (hydrated && items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-6 md:px-12 py-24 text-center">
        <p className="text-white/40 mb-6">Votre panier est vide.</p>
        <Link href="/shop" className="inline-block px-8 py-3 rounded-none bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all">
          Voir le catalogue
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-12 py-12">
      <h1 className="text-3xl md:text-4xl font-display tracking-wider uppercase text-white mb-8">Commande</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-10">
        {/* Coordonnees */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-white/60 text-xs uppercase tracking-[0.3em] mb-4">Contact</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required full />
              <Field label="Prénom" name="firstName" value={form.firstName} onChange={handleChange} required />
              <Field label="Nom" name="lastName" value={form.lastName} onChange={handleChange} required />
              <Field label="Téléphone" name="phone" type="tel" value={form.phone} onChange={handleChange} full />
            </div>
          </section>

          <section>
            <h2 className="text-white/60 text-xs uppercase tracking-[0.3em] mb-4">Adresse de livraison</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <AddressAutocomplete
                label="Adresse"
                value={form.addressLine1}
                required
                onChangeText={(addressLine1) => handleChange('addressLine1', addressLine1)}
                onSelect={(address: SelectedAddress) =>
                  setForm((prev) => ({
                    ...prev,
                    addressLine1: address.addressLine1,
                    postalCode: address.postalCode,
                    city: address.city,
                  }))
                }
              />
              <Field label="Complément d'adresse" name="addressLine2" value={form.addressLine2} onChange={handleChange} full />
              <Field label="Code postal" name="postalCode" value={form.postalCode} onChange={handleChange} required />
              <Field label="Ville" name="city" value={form.city} onChange={handleChange} required />
              <Field label="Pays" name="country" value={form.country} onChange={handleChange} required full />
            </div>
          </section>

          {error && (
            <div className="rounded-none border border-red-500/30 bg-red-500/5 p-4 text-red-300 text-sm">{error}</div>
          )}
        </div>

        {/* Recapitulatif */}
        <div className="lg:col-span-1">
          <div className="rounded-none border border-white/10 bg-[#141414] p-6 sticky top-24">
            <h2 className="text-white font-medium mb-4">Récapitulatif</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId ?? 'base'}`} className="flex justify-between text-sm gap-3">
                  <span className="text-white/60">
                    {item.name}
                    {item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}
                  </span>
                  <span className="text-white/80 whitespace-nowrap">{formatEuros(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm pt-4 border-t border-white/10">
              <div className="flex justify-between text-white/60">
                <span>Sous-total</span>
                <span>{formatEuros(subtotal)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Frais de port</span>
                <span>{formatEuros(shipping)}</span>
              </div>
              <div className="flex justify-between text-white font-semibold pt-2 border-t border-white/10">
                <span>Total</span>
                <span>{formatEuros(total)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full px-6 py-3.5 rounded-none bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Redirection…' : 'Payer'}
            </button>
            <p className="text-white/30 text-[11px] text-center mt-3">Paiement sécurisé par Stripe</p>
            <p className="text-white/30 text-[11px] text-center mt-2">
              En validant votre commande, vous acceptez nos{' '}
              <Link href="/cgv" className="underline underline-offset-2 hover:text-white transition-colors">
                conditions générales de vente
              </Link>
              .
            </p>
          </div>
        </div>
      </form>
    </main>
  );
}
