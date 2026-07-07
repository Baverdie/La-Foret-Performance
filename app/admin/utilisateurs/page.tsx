'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { hasPermission, PERMISSIONS, PERMISSION_GROUPS } from '@/lib/permissions';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ isOpen, title, message, confirmText = 'Confirmer', danger = false, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-display text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors cursor-pointer ${danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white hover:bg-gray-200 text-black'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Member {
  id: string;
  name: string;
  photo: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  _count?: { users: number };
}

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isActive: boolean;
  isPasswordSet: boolean;
  lastLogin: string | null;
  createdAt: string;
  memberId: string | null;
  member: Member | null;
  role: Role;
}

function UtilisateursContent() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleId: '',
    memberId: '',
  });

  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const userPermissions = session?.user?.permissions || [];
  const canCreate = hasPermission(userPermissions, PERMISSIONS.USERS_CREATE);
  const canEdit = hasPermission(userPermissions, PERMISSIONS.USERS_EDIT);
  const canDelete = hasPermission(userPermissions, PERMISSIONS.USERS_DELETE);
  const isSuperAdmin = session?.user?.role === 'super_admin';

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes, membersRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/roles'),
        fetch('/api/admin/members'),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
      }
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data.roles);
      }
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          roleId: formData.roleId,
          memberId: formData.memberId || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowForm(false);
        setEditingUser(null);
        resetForm();
        fetchData();
        showMessage('success', data.message || (editingUser ? 'Utilisateur modifié' : 'Utilisateur créé'));
      } else {
        showMessage('error', data.error || 'Erreur');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showMessage('error', 'Erreur lors de l\'enregistrement');
    }
  };

  const handleResendInvite = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resendInvite: true }),
      });

      const data = await res.json();

      if (res.ok && data.emailSent) {
        showMessage('success', 'Email d\'invitation renvoyé');
      } else {
        showMessage('error', data.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Error resending invite:', error);
      showMessage('error', 'Erreur lors de l\'envoi');
    }
  };

  const handleResetPassword = (userId: string, userName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Réinitialiser le mot de passe',
      message: `Envoyer un email de réinitialisation de mot de passe à "${userName}" ?`,
      confirmText: 'Envoyer',
      danger: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetPassword: true }),
          });

          const data = await res.json();

          if (res.ok && data.emailSent) {
            showMessage('success', 'Email de réinitialisation envoyé');
          } else {
            showMessage('error', data.error || 'Erreur lors de l\'envoi');
          }
        } catch (error) {
          console.error('Error resetting password:', error);
          showMessage('error', 'Erreur lors de l\'envoi');
        }
      },
    });
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingRole ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles';
    const method = editingRole ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleFormData),
      });

      if (res.ok) {
        setShowRoleForm(false);
        setEditingRole(null);
        resetRoleForm();
        fetchData();
        showMessage('success', editingRole ? 'Rôle modifié' : 'Rôle créé');
      } else {
        const data = await res.json();
        showMessage('error', data.error || 'Erreur');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      showMessage('error', 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteRole = (roleId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le rôle',
      message: 'Voulez-vous vraiment supprimer ce rôle ?',
      confirmText: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' });

          if (res.ok) {
            fetchData();
            showMessage('success', 'Rôle supprimé');
          } else {
            const data = await res.json();
            showMessage('error', data.error || 'Erreur');
          }
        } catch (error) {
          console.error('Error deleting role:', error);
          showMessage('error', 'Erreur lors de la suppression');
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      roleId: '',
      memberId: '',
    });
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: '',
      description: '',
      permissions: [],
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      roleId: user.role.id,
      memberId: user.memberId || '',
    });
    setShowForm(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
    });
    setShowRoleForm(true);
  };

  const handleDelete = (id: string, userName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer l\'utilisateur',
      message: `Voulez-vous vraiment supprimer "${userName}" ?\n\nCette action est irréversible.`,
      confirmText: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchData();
            showMessage('success', 'Utilisateur supprimé');
          } else {
            const data = await res.json();
            showMessage('error', data.error || 'Erreur');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
        }
      },
    });
  };

  const togglePermission = (permission: string) => {
    const newPermissions = roleFormData.permissions.includes(permission)
      ? roleFormData.permissions.filter(p => p !== permission)
      : [...roleFormData.permissions, permission];
    setRoleFormData({ ...roleFormData, permissions: newPermissions });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const protectedRoles = ['super_admin', 'admin', 'editor', 'viewer'];

  return (
    <div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        danger={confirmModal.danger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg ${message.type === 'success' ? 'bg-green-500 border border-green-700 text-white' : 'bg-red-500 border border-red-500 text-red-400'
          }`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-6xl md:text-7xl font-display tracking-wide text-white mb-2">Utilisateurs</h1>
          <p className="text-gray-400">Gérer les accès au panel admin</p>
        </div>
        <div className="flex gap-3">
          {isSuperAdmin && (
            <button
              onClick={() => {
                setEditingRole(null);
                resetRoleForm();
                setShowRoleForm(true);
              }}
              className="px-4 py-2 bg-white text-black hover:bg-gray-200 cursor-pointer font-medium rounded-lg transition-colors"
            >
              Nouveau rôle
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => {
                setEditingUser(null);
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-white text-black hover:bg-gray-200 cursor-pointer font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvel utilisateur
            </button>
          )}
        </div>
      </div>

      {showRoleForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-xl p-8 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-display text-white mb-6">
              {editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}
            </h2>
            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nom du rôle</label>
                  <input
                    type="text"
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                    required
                    disabled={!!editingRole && protectedRoles.includes(editingRole.name)}
                    placeholder="moderator"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description</label>
                  <input
                    type="text"
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    placeholder="Modérateur de contenu"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-4">Permissions</label>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                    <div key={group}>
                      <h4 className="text-white text-sm font-medium mb-2">{group}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {permissions.map((perm) => (
                          <label
                            key={perm.key}
                            className="flex items-center gap-2 p-2 bg-[#0a0a0a] rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={roleFormData.permissions.includes(perm.key)}
                              onChange={() => togglePermission(perm.key)}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-500 cursor-pointer focus:ring-green-500"
                            />
                            <span className="text-gray-300 text-sm">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleForm(false);
                    setEditingRole(null);
                  }}
                  className="flex-1 px-4 py-3 border border-white/10 text-gray-400 hover:text-white hover:border-white cursor-pointer rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-white text-black hover:bg-gray-200 cursor-pointer font-medium rounded-lg transition-colors"
                >
                  {editingRole ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-white/10 rounded-xl p-8 w-full max-w-lg">
            <h2 className="text-2xl font-display text-white mb-2">
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h2>
            {!editingUser && (
              <p className="text-gray-400 text-sm mb-6">
                Un email sera envoyé pour définir le mot de passe
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Rôle</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                >
                  <option value="">Sélectionner un rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} ({role.permissions.length} permissions)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Lier à un membre du crew (optionnel)
                </label>
                <select
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                >
                  <option value="">Aucun membre</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <p className="text-gray-500 text-xs mt-1">
                  Permet d'utiliser la photo du membre comme avatar
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-3 border border-white/10 text-gray-400 hover:text-white hover:border-white cursor-pointer rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-white text-black hover:bg-gray-200 cursor-pointer font-medium rounded-lg transition-colors"
                >
                  {editingUser ? 'Enregistrer' : 'Créer et envoyer l\'invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-display text-white mb-4">Rôles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-[#141414] border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-medium">{role.name}</h3>
                {isSuperAdmin && !protectedRoles.includes(role.name) && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-1 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
                {isSuperAdmin && protectedRoles.includes(role.name) && role.name !== 'super_admin' && (
                  <button
                    onClick={() => handleEditRole(role)}
                    className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                    title="Modifier les permissions"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-gray-500 text-sm mb-3">{role.permissions.length} permissions</p>
              <span className="text-xs text-gray-400">
                {role._count?.users || 0} utilisateur(s)
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Utilisateur</th>
              <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Rôle</th>
              <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Dernière connexion</th>
              <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Statut</th>
              <th className="text-right px-6 py-4 text-gray-400 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Chargement...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Aucun utilisateur
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.member?.photo ? (
                        <img
                          src={user.member.photo}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-lfp-green/20 rounded-full flex items-center justify-center">
                          <span className="text-lfp-green font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        {user.member && (
                          <p className="text-lfp-green text-xs">Lié à {user.member.name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-white/10 text-white text-sm rounded-full">
                      {user.role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {!user.isPasswordSet ? (
                        <span className="px-2 py-1 rounded-full text-xs w-fit bg-yellow-500/20 text-yellow-400">
                          En attente
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-1 rounded-full text-xs w-fit ${user.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                            }`}
                        >
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && !user.isPasswordSet && (
                        <button
                          onClick={() => handleResendInvite(user.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          title="Renvoyer l'invitation"
                        >
                          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      {canEdit && user.isPasswordSet && (
                        <button
                          onClick={() => handleResetPassword(user.id, user.name)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          title="Réinitialiser le mot de passe"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {canDelete && user.id !== session?.user?.id && (
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function UtilisateursPage() {
  return (
    <AdminLayout>
      <UtilisateursContent />
    </AdminLayout>
  );
}
