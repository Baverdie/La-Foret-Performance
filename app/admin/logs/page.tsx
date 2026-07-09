'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { useEffect, useState } from 'react';

interface Log {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function LogsContent() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({
    action: '',
    entity: '',
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const res = await fetch(`/api/admin/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-500/20 text-green-400';
      case 'UPDATE':
        return 'bg-blue-500/20 text-blue-400';
      case 'DELETE':
        return 'bg-red-500/20 text-red-400';
      case 'LOGIN':
        return 'bg-purple-500/20 text-purple-400';
      case 'LOGOUT':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-white/10 text-white';
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'MEMBER':
        return '👤';
      case 'CAR':
        return '🚗';
      case 'EVENT':
        return '📅';
      case 'USER':
        return '🔐';
      default:
        return '📝';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'Création';
      case 'UPDATE':
        return 'Modification';
      case 'DELETE':
        return 'Suppression';
      case 'LOGIN':
        return 'Connexion';
      case 'LOGOUT':
        return 'Déconnexion';
      default:
        return action;
    }
  };

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case 'MEMBER':
        return 'Membre';
      case 'CAR':
        return 'Voiture';
      case 'EVENT':
        return 'Événement';
      case 'USER':
        return 'Utilisateur';
      default:
        return entity;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter.action && log.action !== filter.action) return false;
    if (filter.entity && log.entity !== filter.entity) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-6xl md:text-7xl font-display tracking-wide text-white mb-2">Logs d'activité</h1>
        <p className="text-gray-400">Historique des actions sur le panel admin</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter.action}
          onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          className="px-4 py-2 bg-[#141414] border border-white/10 rounded-none text-white focus:outline-none focus:border-lfp-amber"
        >
          <option value="">Toutes les actions</option>
          <option value="CREATE">Création</option>
          <option value="UPDATE">Modification</option>
          <option value="DELETE">Suppression</option>
          <option value="LOGIN">Connexion</option>
          <option value="LOGOUT">Déconnexion</option>
        </select>

        <select
          value={filter.entity}
          onChange={(e) => setFilter({ ...filter, entity: e.target.value })}
          className="px-4 py-2 bg-[#141414] border border-white/10 rounded-none text-white focus:outline-none focus:border-lfp-amber"
        >
          <option value="">Toutes les entités</option>
          <option value="MEMBER">Membre</option>
          <option value="CAR">Voiture</option>
          <option value="EVENT">Événement</option>
          <option value="USER">Utilisateur</option>
        </select>

        {(filter.action || filter.entity) && (
          <button
            onClick={() => setFilter({ action: '', entity: '' })}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Logs List */}
      <div className="bg-[#141414] border border-white/10 rounded-none overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucun log</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-white/10 rounded-none flex items-center justify-center text-lg flex-shrink-0">
                    {getEntityIcon(log.entity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {getEntityLabel(log.entity)}
                      </span>
                    </div>

                    <p className="text-white mb-1">
                      <span className="text-lfp-amber">{log.user.name}</span>
                      {' '}a effectué une action
                      {log.details && (
                        <span className="text-gray-400">
                          {' : '}
                          {(() => {
                            try {
                              const details = JSON.parse(log.details);
                              return Object.entries(details)
                                .slice(0, 2)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', ');
                            } catch {
                              return log.details;
                            }
                          })()}
                        </span>
                      )}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatDate(log.createdAt)}</span>
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} logs)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-none transition-colors"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-none transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LogsPage() {
  return (
    <AdminLayout>
      <LogsContent />
    </AdminLayout>
  );
}
