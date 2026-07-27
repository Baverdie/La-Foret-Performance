'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatEuros, ORDER_STATUS_LABELS } from '@/lib/shop/format';
import { ALLOWED_TRANSITIONS, type OrderStatus } from '@/lib/shop/order-status';

interface OrderItem {
  id: string;
  productName: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  country: string;
  subtotal: number;
  shippingCost: number;
  processingFee: number;
  total: number;
  status: string;
  trackingNumber: string | null;
  cancelRequestedAt: string | null;
  createdAt: string;
  items: OrderItem[];
  campaign: { id: string; name: string } | null;
}

const FILTERS = ['ALL', 'PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'];

// Libelle du bouton d'action pour chaque transition de statut.
const ACTION_LABELS: Record<string, string> = {
  PAID: 'Marquer payée',
  IN_PRODUCTION: 'Lancer la production',
  SHIPPED: 'Marquer expédiée',
  DELIVERED: 'Marquer livrée',
  CANCELLED: 'Annuler et rembourser',
  REFUNDED: 'Rembourser',
};

// Transitions destructives demandant une confirmation explicite.
const CONFIRM_TRANSITIONS = ['CANCELLED', 'REFUNDED'];

// Couleur d'un badge de statut.
function statusBadgeClass(status: string): string {
  switch (status) {
    case 'PAID':
      return 'bg-blue-500/20 text-blue-300';
    case 'IN_PRODUCTION':
      return 'bg-orange-500/20 text-orange-300';
    case 'SHIPPED':
      return 'bg-violet-500/20 text-violet-300';
    case 'DELIVERED':
      return 'bg-lfp-amber/20 text-lfp-amber';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'bg-red-500/20 text-red-300';
    default:
      return 'bg-white/10 text-gray-400';
  }
}

// Formate une date ISO en date et heure françaises.
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CommandesContent() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState<Order | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [shippingMode, setShippingMode] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');

  const canEdit = hasPermission(session?.user?.permissions || [], PERMISSIONS.ORDERS_EDIT);

  // Recupere les commandes selon le filtre de statut.
  const fetchOrders = async (status: string) => {
    setIsLoading(true);
    try {
      const query = status === 'ALL' ? '' : `?status=${status}`;
      const res = await fetch(`/api/admin/orders${query}`);
      if (res.ok) {
        setOrders((await res.json()).orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(filter);
  }, [filter]);

  // Applique une transition de statut (avec numero de suivi optionnel pour l'expedition).
  // Les transitions destructives (annulation, remboursement) sont confirmees en amont.
  const updateStatus = async (id: string, status: string, trackingNumber?: string) => {
    if (CONFIRM_TRANSITIONS.includes(status)) {
      const label = status === 'CANCELLED' ? 'annuler et rembourser' : 'rembourser intégralement';
      if (!window.confirm(`Confirmer : ${label} cette commande ? Cette action est définitive.`)) {
        return;
      }
    }
    setActionPending(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(trackingNumber ? { trackingNumber } : {}) }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) => prev.map((order) => (order.id === id ? data.order : order)));
        setSelected((prev) => (prev && prev.id === id ? data.order : prev));
        setShippingMode(false);
        setTrackingInput('');
      } else {
        setActionError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setActionError('Erreur réseau');
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-6xl md:text-7xl font-display tracking-wide text-white mb-2">Commandes</h1>
        <p className="text-gray-400">Suivi et gestion des commandes</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-none text-sm transition-colors cursor-pointer ${
              filter === status ? 'bg-white text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            {status === 'ALL' ? 'Toutes' : ORDER_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Detail commande */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-none p-8 w-full max-w-lg my-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display text-white">{selected.orderNumber}</h2>
                <p className="text-gray-400 text-sm">{formatDateTime(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                ✕
              </button>
            </div>

            {/* Client */}
            <div className="bg-[#0a0a0a] rounded-none p-4 mb-4 text-sm">
              <p className="text-white">{selected.firstName} {selected.lastName}</p>
              <p className="text-gray-400">{selected.email}</p>
              {selected.phone && <p className="text-gray-400">{selected.phone}</p>}
              <p className="text-gray-400 mt-2">
                {selected.addressLine1}
                {selected.addressLine2 ? `, ${selected.addressLine2}` : ''}
                <br />
                {selected.postalCode} {selected.city}, {selected.country}
              </p>
              {selected.campaign && (
                <p className="text-lfp-amber text-xs mt-2">Précommande : {selected.campaign.name}</p>
              )}
            </div>

            {/* Articles */}
            <div className="space-y-2 mb-4">
              {selected.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {item.productName}
                    {item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}
                  </span>
                  <span className="text-white">{formatEuros(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-sm border-t border-white/10 pt-3 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Sous-total</span>
                <span>{formatEuros(selected.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Frais de port</span>
                <span>{formatEuros(selected.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Frais de traitement</span>
                <span>{formatEuros(selected.processingFee)}</span>
              </div>
              <div className="flex justify-between text-white font-semibold">
                <span>Total</span>
                <span>{formatEuros(selected.total)}</span>
              </div>
            </div>

            {/* Suivi colis et demande d'annulation */}
            {selected.trackingNumber && (
              <p className="text-gray-400 text-sm mb-4">
                Suivi colis : <span className="text-white tracking-wider">{selected.trackingNumber}</span>
              </p>
            )}
            {selected.cancelRequestedAt && (
              <div className="rounded-none border border-lfp-amber/30 bg-lfp-amber/5 p-3 mb-4">
                <p className="text-lfp-amber text-sm">
                  Le client a demandé l'annulation le {formatDateTime(selected.cancelRequestedAt)}.
                </p>
              </div>
            )}

            {/* Actions de transition pilotees par la machine a etats */}
            {canEdit && (
              <div>
                <p className="block text-sm text-gray-400 mb-2">Actions</p>
                {actionError && (
                  <div className="rounded-none border border-red-500/30 bg-red-500/5 p-3 mb-3 text-red-300 text-sm">
                    {actionError}
                  </div>
                )}
                {shippingMode ? (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="trackingNumber" className="block text-xs text-gray-400 mb-1.5">
                        Numéro de suivi La Poste (optionnel)
                      </label>
                      <input
                        id="trackingNumber"
                        type="text"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        placeholder="Ex. 6A12345678901"
                        className="w-full px-4 py-3 bg-lfp-dark border border-white/10 rounded-none text-white text-sm focus:outline-none focus:border-lfp-amber"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(selected.id, 'SHIPPED', trackingInput)}
                        disabled={actionPending}
                        className="px-5 py-2.5 rounded-none bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {actionPending ? 'Envoi…' : "Confirmer l'expédition"}
                      </button>
                      <button
                        onClick={() => setShippingMode(false)}
                        className="px-5 py-2.5 rounded-none border border-white/15 text-gray-400 text-sm hover:text-white hover:border-white/40 transition-all cursor-pointer"
                      >
                        Retour
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(ALLOWED_TRANSITIONS[selected.status as OrderStatus] ?? []).map((target) => (
                      <button
                        key={target}
                        onClick={() =>
                          target === 'SHIPPED' ? setShippingMode(true) : updateStatus(selected.id, target)
                        }
                        disabled={actionPending}
                        className={`px-5 py-2.5 rounded-none text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer ${
                          CONFIRM_TRANSITIONS.includes(target)
                            ? 'border border-red-500/40 text-red-300 hover:bg-red-500/10'
                            : 'bg-white text-black hover:bg-gray-200'
                        }`}
                      >
                        {ACTION_LABELS[target] ?? target}
                      </button>
                    ))}
                    {(ALLOWED_TRANSITIONS[selected.status as OrderStatus] ?? []).length === 0 && (
                      <p className="text-gray-500 text-sm">Statut final — aucune action disponible.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Chargement...</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-400 py-12">Aucune commande</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => {
                setSelected(order);
                setShippingMode(false);
                setTrackingInput('');
                setActionError(null);
              }}
              className="w-full text-left bg-[#141414] border border-white/10 rounded-none p-5 flex items-center justify-between gap-4 hover:border-white/30 transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">{order.orderNumber}</span>
                  <span className={`px-2.5 py-1 rounded-none text-xs ${statusBadgeClass(order.status)}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  {order.cancelRequestedAt && (
                    <span className="px-2.5 py-1 rounded-none text-xs bg-lfp-amber/20 text-lfp-amber">
                      Annulation demandée
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-1 truncate">
                  {order.firstName} {order.lastName} · {order.items.length} article(s) · {formatDateTime(order.createdAt)}
                </p>
              </div>
              <span className="text-white font-semibold whitespace-nowrap">{formatEuros(order.total)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommandesPage() {
  return (
    <AdminLayout>
      <CommandesContent />
    </AdminLayout>
  );
}
