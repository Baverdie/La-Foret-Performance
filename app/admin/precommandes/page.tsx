'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/shop/format';

interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  _count?: { products: number; orders: number };
}

interface ProductionLine {
  productId: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  quantity: number;
}

const STATUS_OPTIONS = ['DRAFT', 'OPEN', 'CLOSED', 'IN_PRODUCTION', 'COMPLETED'];

// Formate une date ISO en date courte française.
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Convertit une date ISO en valeur d'input date (yyyy-mm-dd).
function toDateInput(iso: string): string {
  return iso ? new Date(iso).toISOString().split('T')[0] : '';
}

function PrecommandesContent() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', startDate: '', endDate: '', status: 'DRAFT' });

  // Etat de la vue production.
  const [productionCampaign, setProductionCampaign] = useState<Campaign | null>(null);
  const [production, setProduction] = useState<ProductionLine[]>([]);
  const [productionTotal, setProductionTotal] = useState(0);

  const userPermissions = session?.user?.permissions || [];
  const canCreate = hasPermission(userPermissions, PERMISSIONS.CAMPAIGNS_CREATE);
  const canEdit = hasPermission(userPermissions, PERMISSIONS.CAMPAIGNS_EDIT);
  const canDelete = hasPermission(userPermissions, PERMISSIONS.CAMPAIGNS_DELETE);

  // Recupere la liste des campagnes.
  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const resetForm = () => setFormData({ name: '', description: '', startDate: '', endDate: '', status: 'DRAFT' });

  // Cree ou met a jour une campagne.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/admin/campaigns/${editing.id}` : '/api/admin/campaigns';
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setEditing(null);
        resetForm();
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditing(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      startDate: toDateInput(campaign.startDate),
      endDate: toDateInput(campaign.endDate),
      status: campaign.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette campagne ? Les produits liés repasseront en vente à la demande.')) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  // Ouvre la vue production d'une campagne (quantites a produire).
  const openProduction = async (campaign: Campaign) => {
    setProductionCampaign(campaign);
    setProduction([]);
    setProductionTotal(0);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/production`);
      if (res.ok) {
        const data = await res.json();
        setProduction(data.production);
        setProductionTotal(data.totalUnits);
      }
    } catch (error) {
      console.error('Error fetching production:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-6xl md:text-7xl font-display tracking-wide text-white mb-2">Précommandes</h1>
          <p className="text-gray-400">Vagues de production sans surplus</p>
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
            Nouvelle campagne
          </button>
        )}
      </div>

      {/* Formulaire campagne */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-none p-8 w-full max-w-lg my-8">
            <h2 className="text-2xl font-display text-white mb-6">
              {editing ? 'Modifier la campagne' : 'Nouvelle campagne'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Drop Hiver 2026"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-none text-white focus:outline-none focus:border-lfp-amber"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-none text-white focus:outline-none focus:border-lfp-amber resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ouverture</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-none text-white focus:outline-none focus:border-lfp-amber"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Clôture</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-none text-white focus:outline-none focus:border-lfp-amber"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-none text-white focus:outline-none focus:border-lfp-amber cursor-pointer"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {CAMPAIGN_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Les produits ne sont précommandables que lorsque la campagne est « Ouverte ».</p>
              </div>
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

      {/* Vue production */}
      {productionCampaign && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-none p-8 w-full max-w-lg my-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display text-white">À produire</h2>
                <p className="text-gray-400 text-sm">{productionCampaign.name}</p>
              </div>
              <button
                onClick={() => setProductionCampaign(null)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            {production.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Aucune commande payée pour cette campagne.</p>
            ) : (
              <div className="space-y-2">
                {production.map((line) => (
                  <div
                    key={`${line.productId}-${line.variantId ?? 'base'}`}
                    className="flex items-center justify-between py-3 border-b border-white/10"
                  >
                    <span className="text-white text-sm">
                      {line.productName}
                      {line.variantLabel && <span className="text-gray-500"> · {line.variantLabel}</span>}
                    </span>
                    <span className="text-lfp-amber font-semibold tabular-nums">×{line.quantity}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-4 mt-2">
                  <span className="text-white font-medium">Total à produire</span>
                  <span className="text-white font-bold text-lg tabular-nums">{productionTotal}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Chargement...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center text-gray-400 py-12">Aucune campagne</div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-[#141414] border border-white/10 rounded-none p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-display text-white">{campaign.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-none text-xs ${
                        campaign.status === 'OPEN'
                          ? 'bg-lfp-amber/20 text-lfp-amber'
                          : campaign.status === 'IN_PRODUCTION'
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      {CAMPAIGN_STATUS_LABELS[campaign.status]}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Du {formatDate(campaign.startDate)} au {formatDate(campaign.endDate)}
                  </p>
                  {campaign.description && <p className="text-gray-500 text-sm mt-2 line-clamp-2">{campaign.description}</p>}
                  <p className="text-gray-500 text-xs mt-2">
                    {campaign._count?.products ?? 0} produit(s) · {campaign._count?.orders ?? 0} commande(s)
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openProduction(campaign)}
                    className="px-4 py-2 bg-lfp-amber/20 hover:bg-lfp-amber/30 text-lfp-amber text-sm cursor-pointer rounded-none transition-colors"
                  >
                    Production
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => handleEdit(campaign)}
                      className="px-4 py-2 bg-white text-black hover:bg-gray-200 cursor-pointer font-medium rounded-none transition-colors text-sm"
                    >
                      Modifier
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm cursor-pointer rounded-none transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function PrecommandesPage() {
  return (
    <AdminLayout>
      <PrecommandesContent />
    </AdminLayout>
  );
}
