'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatEuros, CATEGORY_LABELS } from '@/lib/shop/format';

interface Variant {
  id?: string;
  label: string;
  size: string | null;
  color: string | null;
  priceDelta: number;
  stockLimit: number | null;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string[];
  category: string;
  images: string[];
  basePrice: number;
  availabilityMode: string;
  campaignId: string | null;
  hasVariants: boolean;
  isActive: boolean;
  variants: Variant[];
}

interface CampaignOption {
  id: string;
  name: string;
  status: string;
}

// Ligne d'option de variante (une taille ou une couleur) dans le formulaire.
interface VariantRow {
  id?: string;
  value: string;
  priceDeltaEuros: string;
  stockLimit: string;
  isActive: boolean;
}

const CATEGORY_OPTIONS = ['TEXTILE', 'STICKER', 'PLATE', 'OTHER'];

// Convertit une saisie en euros (chaine) vers des centimes (entier).
function eurosToCents(value: string): number {
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

// Convertit des centimes en chaine euros pour l'affichage dans un input.
function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2);
}

// Construit les variantes à envoyer à l'API à partir des deux listes (tailles, couleurs).
// - tailles ET couleurs remplies -> combinaisons couleur × taille (supplément additionné).
// - une seule liste -> variantes mono-axe (ids conservés pour l'historique).
function buildVariants(sizeRows: VariantRow[], colorRows: VariantRow[]) {
  const sizes = sizeRows.filter((r) => r.value.trim());
  const colors = colorRows.filter((r) => r.value.trim());
  const delta = (r: VariantRow) => eurosToCents(r.priceDeltaEuros || '0');
  const stock = (r: VariantRow) => (r.stockLimit ? parseInt(r.stockLimit, 10) : null);

  if (sizes.length && colors.length) {
    const out: { color: string; size: string; priceDelta: number; stockLimit: number | null; isActive: boolean; order: number }[] = [];
    let order = 0;
    for (const c of colors) {
      for (const s of sizes) {
        out.push({
          color: c.value.trim(),
          size: s.value.trim(),
          priceDelta: delta(s) + delta(c),
          stockLimit: null,
          isActive: true,
          order: order++,
        });
      }
    }
    return out;
  }
  if (sizes.length) {
    return sizes.map((s, i) => ({ id: s.id, color: null, size: s.value.trim(), priceDelta: delta(s), stockLimit: stock(s), isActive: s.isActive, order: i }));
  }
  if (colors.length) {
    return colors.map((c, i) => ({ id: c.id, color: c.value.trim(), size: null, priceDelta: delta(c), stockLimit: stock(c), isActive: c.isActive, order: i }));
  }
  return [];
}

// Etat initial du formulaire produit (prix en euros sous forme de chaine pour la saisie).
const EMPTY_FORM = {
  name: '',
  description: '',
  details: '', // une info par ligne (matière, technique…)
  category: 'TEXTILE',
  images: [] as string[],
  basePriceEuros: '',
  availabilityMode: 'MADE_TO_ORDER',
  campaignId: '',
  hasVariants: false,
  isActive: true,
  // Deux axes indépendants : si les deux sont remplis, on génère les combinaisons couleur × taille.
  sizeRows: [] as VariantRow[],
  colorRows: [] as VariantRow[],
};

function BoutiqueContent() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [variantTab, setVariantTab] = useState<'SIZE' | 'COLOR'>('SIZE');

  const userPermissions = session?.user?.permissions || [];
  const canCreate = hasPermission(userPermissions, PERMISSIONS.PRODUCTS_CREATE);
  const canEdit = hasPermission(userPermissions, PERMISSIONS.PRODUCTS_EDIT);
  const canDelete = hasPermission(userPermissions, PERMISSIONS.PRODUCTS_DELETE);

  // Charge produits et campagnes.
  const fetchData = async () => {
    try {
      const [productsRes, campaignsRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/campaigns'),
      ]);
      if (productsRes.ok) setProducts((await productsRes.json()).products);
      if (campaignsRes.ok) setCampaigns((await campaignsRes.json()).campaigns);
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setVariantTab('SIZE');
  };

  // Cree ou met a jour un produit (conversion euros -> centimes a la soumission).
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/admin/products/${editing.id}` : '/api/admin/products';
    const method = editing ? 'PUT' : 'POST';

    const payload = {
      name: formData.name,
      description: formData.description,
      details: formData.details.split('\n').map((d) => d.trim()).filter(Boolean),
      category: formData.category,
      images: formData.images,
      basePrice: eurosToCents(formData.basePriceEuros),
      availabilityMode: formData.availabilityMode,
      campaignId: formData.availabilityMode === 'PRECOMMANDE' ? formData.campaignId : null,
      hasVariants: formData.hasVariants,
      isActive: formData.isActive,
      variants: formData.hasVariants ? buildVariants(formData.sizeRows, formData.colorRows) : [],
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowForm(false);
        setEditing(null);
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditing(product);

    // Décompose les variantes en deux listes (tailles, couleurs) par valeurs distinctes.
    // Pour le mono-axe on conserve l'id (préserve l'historique) ; pas en combinaisons.
    const sizeMap = new Map<string, Variant>();
    const colorMap = new Map<string, Variant>();
    for (const variant of product.variants) {
      if (variant.size && !sizeMap.has(variant.size)) sizeMap.set(variant.size, variant);
      if (variant.color && !colorMap.has(variant.color)) colorMap.set(variant.color, variant);
    }
    const isMatrix = sizeMap.size > 0 && colorMap.size > 0;
    const toRow = (value: string, variant: Variant): VariantRow => ({
      id: isMatrix ? undefined : variant.id,
      value,
      priceDeltaEuros: isMatrix ? '0' : centsToEuros(variant.priceDelta),
      stockLimit: !isMatrix && variant.stockLimit !== null ? String(variant.stockLimit) : '',
      isActive: variant.isActive,
    });

    setFormData({
      name: product.name,
      description: product.description,
      details: (product.details || []).join('\n'),
      category: product.category,
      images: product.images,
      basePriceEuros: centsToEuros(product.basePrice),
      availabilityMode: product.availabilityMode,
      campaignId: product.campaignId || '',
      hasVariants: product.hasVariants,
      isActive: product.isActive,
      sizeRows: [...sizeMap.entries()].map(([value, variant]) => toRow(value, variant)),
      colorRows: [...colorMap.entries()].map(([value, variant]) => toRow(value, variant)),
    });
    setVariantTab('SIZE');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Suppression impossible');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // Gestion de l'editeur de variantes (ligne de l'onglet actif : tailles ou couleurs).
  const rowsKey = variantTab === 'SIZE' ? 'sizeRows' : 'colorRows';

  const addRow = () =>
    setFormData((prev) => ({
      ...prev,
      [rowsKey]: [...prev[rowsKey], { value: '', priceDeltaEuros: '0', stockLimit: '', isActive: true }],
    }));

  const updateRow = (index: number, field: keyof VariantRow, value: string | boolean) =>
    setFormData((prev) => ({
      ...prev,
      [rowsKey]: prev[rowsKey].map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));

  const removeRow = (index: number) =>
    setFormData((prev) => ({ ...prev, [rowsKey]: prev[rowsKey].filter((_, i) => i !== index) }));

  const currentRows = formData[rowsKey];

  const inputClass =
    'w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-none text-white focus:outline-none focus:border-lfp-amber';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-6xl md:text-7xl font-display tracking-wide text-white mb-2">Boutique</h1>
          <p className="text-gray-400">Gérer les produits et leurs variantes</p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setEditing(null);
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-white text-black hover:bg-gray-200 cursor-pointer font-medium rounded-none transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau produit
          </button>
        )}
      </div>

      {/* Formulaire produit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-none p-8 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-display text-white mb-6">
              {editing ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nom</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="T-shirt LFP"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Détails produit (une info par ligne)</label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  rows={4}
                  placeholder={'Coton 220g/m²\nSérigraphie\nCoupe unisexe'}
                  className={`${inputClass} resize-none`}
                />
                <p className="text-xs text-gray-500 mt-1">Matière, technique (brodé/imprimé), coupe… affichées en fiche technique sur la page produit.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Prix de base (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePriceEuros}
                    onChange={(e) => setFormData({ ...formData, basePriceEuros: e.target.value })}
                    required
                    placeholder="29.90"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Disponibilité</label>
                  <select
                    value={formData.availabilityMode}
                    onChange={(e) => setFormData({ ...formData, availabilityMode: e.target.value })}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="MADE_TO_ORDER">À la demande</option>
                    <option value="PRECOMMANDE">Précommande</option>
                  </select>
                </div>
              </div>

              {formData.availabilityMode === 'PRECOMMANDE' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Campagne de précommande</label>
                  <select
                    value={formData.campaignId}
                    onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                    required
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">Sélectionner une campagne</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                  {campaigns.length === 0 && (
                    <p className="text-xs text-orange-300 mt-1">Créez d'abord une campagne dans Précommandes.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">Images</label>
                <ImageUpload
                  value={formData.images}
                  onChange={(images) => setFormData({ ...formData, images: images as string[] })}
                  multiple
                  folder="lfp/shop"
                  aspect={4 / 5}
                />
              </div>

              {/* Variantes */}
              <div className="border-t border-white/10 pt-4">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={formData.hasVariants}
                    onChange={(e) => setFormData({ ...formData, hasVariants: e.target.checked })}
                    className="w-4 h-4 accent-lfp-amber"
                  />
                  <span className="text-white text-sm">Ce produit a des variantes (tailles, couleurs…)</span>
                </label>

                {formData.hasVariants && (
                  <div className="space-y-3">
                    {/* Onglets : Tailles puis Couleurs */}
                    <div className="flex border-b border-white/10">
                      {(['SIZE', 'COLOR'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setVariantTab(tab)}
                          className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors cursor-pointer ${
                            variantTab === tab
                              ? 'border-white text-white'
                              : 'border-transparent text-gray-500 hover:text-white'
                          }`}
                        >
                          {tab === 'SIZE' ? 'Tailles' : 'Couleurs'}
                          {(tab === 'SIZE' ? formData.sizeRows : formData.colorRows).filter((r) => r.value.trim()).length > 0 && (
                            <span className="ml-1.5 text-xs text-gray-500">
                              ({(tab === 'SIZE' ? formData.sizeRows : formData.colorRows).filter((r) => r.value.trim()).length})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {currentRows.length === 0 && (
                      <p className="text-sm text-gray-500 py-1">
                        Aucune {variantTab === 'SIZE' ? 'taille' : 'couleur'} pour l'instant.
                      </p>
                    )}

                    {currentRows.map((row, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => updateRow(index, 'value', e.target.value)}
                          placeholder={variantTab === 'SIZE' ? 'Taille (ex. M)' : 'Couleur (ex. Noir)'}
                          className="flex-1 min-w-0 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-none text-white text-sm focus:outline-none focus:border-lfp-amber"
                        />
                        {/* Supplément de prix et stock : pertinents par taille uniquement */}
                        {variantTab === 'SIZE' && (
                          <>
                            <input
                              type="number"
                              step="0.01"
                              value={row.priceDeltaEuros}
                              onChange={(e) => updateRow(index, 'priceDeltaEuros', e.target.value)}
                              placeholder="+€"
                              title="Supplément de prix (€)"
                              className="w-20 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-none text-white text-sm focus:outline-none focus:border-lfp-amber"
                            />
                            <input
                              type="number"
                              value={row.stockLimit}
                              onChange={(e) => updateRow(index, 'stockLimit', e.target.value)}
                              placeholder="Stock"
                              title="Limite de stock optionnelle (vide = illimité)"
                              className="w-24 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-none text-white text-sm focus:outline-none focus:border-lfp-amber"
                            />
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-none transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addRow}
                      className="text-sm text-lfp-amber hover:underline cursor-pointer"
                    >
                      + Ajouter {variantTab === 'SIZE' ? 'une taille' : 'une couleur'}
                    </button>

                    {formData.sizeRows.some((r) => r.value.trim()) && formData.colorRows.some((r) => r.value.trim()) && (
                      <p className="text-xs text-gray-500 pt-1">
                        Tailles et couleurs renseignées : toutes les combinaisons seront générées automatiquement.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-lfp-amber"
                />
                <span className="text-white text-sm">Produit visible dans la boutique</span>
              </label>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 border border-white/10 text-gray-400 hover:border-white hover:text-white cursor-pointer rounded-none transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-white text-black hover:bg-gray-200 cursor-pointer font-medium rounded-none transition-colors"
                >
                  {editing ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grille produits */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Chargement...</div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-400 py-12">Aucun produit</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((product) => (
            <div key={product.id} className="bg-[#141414] border border-white/10 rounded-none overflow-hidden">
              <div className="relative aspect-4/5 bg-black">
                {product.images[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill sizes="400px" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
                    Pas d'image
                  </div>
                )}
                {!product.isActive && (
                  <span className="absolute top-3 right-3 bg-black/70 text-white/70 text-xs px-2 py-1 rounded-none">
                    Masqué
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-white/40 uppercase tracking-[0.2em]">
                      {CATEGORY_LABELS[product.category] || product.category}
                    </p>
                    <h3 className="text-white font-medium mt-0.5">{product.name}</h3>
                  </div>
                  <span className="text-white font-semibold whitespace-nowrap">{formatEuros(product.basePrice)}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  <span className="px-2 py-1 rounded-none bg-white/5 text-white/50">
                    {product.availabilityMode === 'PRECOMMANDE' ? 'Précommande' : 'À la demande'}
                  </span>
                  {product.hasVariants && (
                    <span className="px-2 py-1 rounded-none bg-white/5 text-white/50">
                      {product.variants.length} variante(s)
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  {canEdit && (
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 px-4 py-2 bg-white text-black hover:bg-gray-200 cursor-pointer font-medium rounded-none transition-colors text-sm"
                    >
                      Modifier
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm cursor-pointer rounded-none transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BoutiquePage() {
  return (
    <AdminLayout>
      <BoutiqueContent />
    </AdminLayout>
  );
}
