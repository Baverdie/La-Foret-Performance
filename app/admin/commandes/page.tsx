'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatEuros, ORDER_STATUS_LABELS } from '@/lib/shop/format';

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
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  campaign: { id: string; name: string } | null;
}

// Statuts proposes a la modification manuelle par l'admin.
const STATUS_FLOW = ['PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const FILTERS = ['ALL', 'PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'];

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

  // Met a jour le statut d'une commande.
  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) => prev.map((order) => (order.id === id ? data.order : order)));
        setSelected((prev) => (prev && prev.id === id ? data.order : prev));
      }
    } catch (error) {
      console.error('Error updating order:', error);
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
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
              <div className="flex justify-between text-white font-semibold">
                <span>Total</span>
                <span>{formatEuros(selected.total)}</span>
              </div>
            </div>

            {/* Changement de statut */}
            {canEdit && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Statut</label>
                <select
                  value={selected.status}
                  onChange={(e) => updateStatus(selected.id, e.target.value)}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-none text-white focus:outline-none focus:border-lfp-amber cursor-pointer"
                >
                  {STATUS_FLOW.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
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
              onClick={() => setSelected(order)}
              className="w-full text-left bg-[#141414] border border-white/10 rounded-none p-5 flex items-center justify-between gap-4 hover:border-white/30 transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">{order.orderNumber}</span>
                  <span className={`px-2.5 py-1 rounded-none text-xs ${statusBadgeClass(order.status)}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
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
