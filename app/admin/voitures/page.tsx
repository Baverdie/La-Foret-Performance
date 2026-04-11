'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import Image from 'next/image';

interface Member {
  id: string;
  name: string;
}

interface Car {
  id: string;
  model: string;
  year: string;
  photos: string[];
  containPhotos: number[];
  engine: string;
  power: string;
  modifications: string;
  story: string;
  memberId: string;
  member: Member;
  order: number;
  isActive: boolean;
}

function getPatternPosition(index: number): { label: string; short: string; colorClass: string } {
  const pos = index % 6;
  const block = Math.floor(index / 6) + 1;
  const positions = [
    { short: 'Bannière', label: `Bloc ${block} · Bannière pleine largeur`, colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { short: 'Grille G', label: `Bloc ${block} · Grille gauche`, colorClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
    { short: 'Grille D', label: `Bloc ${block} · Grille droite`, colorClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
    { short: 'Petite HG', label: `Bloc ${block} · Petite haut-gauche`, colorClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
    { short: 'Petite BG', label: `Bloc ${block} · Petite bas-gauche`, colorClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
    { short: 'Portrait D', label: `Bloc ${block} · Portrait droite`, colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  ];
  return positions[pos];
}

function GaragePatternLegend() {
  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-6 mb-8">
      <h2 className="text-sm text-white/40 uppercase tracking-[0.3em] mb-4">Pattern de galerie — 6 positions par bloc</h2>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-72 shrink-0 space-y-1.5">
          <div className="h-10 rounded bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
            <span className="text-blue-300 text-xs font-medium">① Bannière pleine largeur</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-8 rounded bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
              <span className="text-violet-300 text-xs">② Grille G</span>
            </div>
            <div className="h-8 rounded bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
              <span className="text-violet-300 text-xs">③ Grille D</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="space-y-1.5">
              <div className="h-7 rounded bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                <span className="text-orange-300 text-xs">④ HG</span>
              </div>
              <div className="h-7 rounded bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                <span className="text-orange-300 text-xs">⑤ BG</span>
              </div>
            </div>
            <div className="h-[3.875rem] rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <span className="text-emerald-300 text-xs">⑥ Portrait D</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          {[
            { num: '①', short: 'Bannière', desc: 'Grande carte pleine largeur, très mise en valeur. Idéale pour la voiture principale du bloc.', color: 'text-blue-300' },
            { num: '②③', short: 'Grille gauche / droite', desc: 'Deux cartes côte à côte en format paysage. Bon contraste entre deux voitures.', color: 'text-violet-300' },
            { num: '④⑤', short: 'Petites haut/bas gauche', desc: 'Deux petites cartes empilées. Format compact, idéal pour des détails ou voitures secondaires.', color: 'text-orange-300' },
            { num: '⑥', short: 'Portrait droite', desc: 'Grande carte portrait qui occupe toute la hauteur droite. Superbe pour les photos verticales.', color: 'text-emerald-300' },
          ].map(({ num, short, desc, color }) => (
            <div key={num} className="flex gap-3">
              <span className={`text-lg font-bold shrink-0 ${color}`}>{num}</span>
              <div>
                <p className={`text-sm font-medium ${color}`}>{short}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
            className="flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white hover:bg-gray-200 text-black'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function VoituresContent() {
  const { data: session } = useSession();
  const [cars, setCars] = useState<Car[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({
    model: '',
    year: '',
    photos: [] as string[],
    containPhotos: [] as number[],
    engine: '',
    power: '',
    modifications: '',
    story: '',
    memberId: '',
    order: 0,
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

  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const userPermissions = session?.user?.permissions || [];
  const canCreate = hasPermission(userPermissions, PERMISSIONS.CARS_CREATE);
  const canEdit = hasPermission(userPermissions, PERMISSIONS.CARS_EDIT);
  const canDelete = hasPermission(userPermissions, PERMISSIONS.CARS_DELETE);

  const fetchData = async () => {
    try {
      const [carsRes, membersRes] = await Promise.all([
        fetch('/api/admin/cars'),
        fetch('/api/admin/members'),
      ]);

      if (carsRes.ok) {
        const data = await carsRes.json();
        setCars(data.cars);
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

  const saveOrder = useCallback((orderedCars: Car[]) => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    setIsSavingOrder(true);
    saveDebounceRef.current = setTimeout(async () => {
      try {
        const orders = orderedCars.map((car, index) => ({ id: car.id, order: index }));
        await fetch('/api/admin/cars/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders }),
        });
      } catch (error) {
        console.error('Error saving order:', error);
      } finally {
        setIsSavingOrder(false);
      }
    }, 800);
  }, []);

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex: number) => {
    const sourceIndex = dragIndexRef.current;
    if (sourceIndex === null || sourceIndex === targetIndex) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }

    const newCars = [...cars];
    const [moved] = newCars.splice(sourceIndex, 1);
    newCars.splice(targetIndex, 0, moved);
    setCars(newCars);
    saveOrder(newCars);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const movecar = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= cars.length) return;
    const newCars = [...cars];
    [newCars[index], newCars[newIndex]] = [newCars[newIndex], newCars[index]];
    setCars(newCars);
    saveOrder(newCars);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingCar ? `/api/admin/cars/${editingCar.id}` : '/api/admin/cars';
    const method = editingCar ? 'PUT' : 'POST';

    try {
      const payload = editingCar ? formData : (({ order: _order, ...rest }) => rest)(formData);
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingCar(null);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error saving car:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      model: '',
      year: '',
      photos: [],
      containPhotos: [],
      engine: '',
      power: '',
      modifications: '',
      story: '',
      memberId: '',
      order: 0,
    });
  };

  const handleEdit = (car: Car) => {
    setEditingCar(car);
    setFormData({
      model: car.model,
      year: car.year,
      photos: car.photos || [],
      containPhotos: car.containPhotos || [],
      engine: car.engine,
      power: car.power,
      modifications: car.modifications,
      story: car.story,
      memberId: car.memberId,
      order: car.order,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string, model: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer la voiture',
      message: `Voulez-vous vraiment supprimer "${model}" ?`,
      confirmText: 'Supprimer',
      danger: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/cars/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchData();
          } else {
            const data = await res.json();
            alert(data.error || 'Erreur lors de la suppression');
          }
        } catch (error) {
          console.error('Error deleting car:', error);
          alert('Erreur de connexion au serveur');
        }
      },
    });
  };

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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-7xl font-black text-white mb-2">Voitures</h1>
          <p className="text-gray-400">Gérer les voitures du garage</p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setEditingCar(null);
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-white/50 hover:bg-white text-black cursor-pointer font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter une voiture
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-xl p-8 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-display text-white mb-6">
              {editingCar ? 'Modifier la voiture' : 'Nouvelle voiture'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Modèle</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    placeholder="BMW E30 316"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Année</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                    placeholder="1988"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Propriétaire</label>
                <select
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                >
                  <option value="">Sélectionner un membre</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Moteur</label>
                  <input
                    type="text"
                    value={formData.engine}
                    onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                    placeholder="1.6L 4 cylindres"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Puissance</label>
                  <input
                    type="text"
                    value={formData.power}
                    onChange={(e) => setFormData({ ...formData, power: e.target.value })}
                    placeholder="102 ch"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Modifications</label>
                <textarea
                  value={formData.modifications}
                  onChange={(e) => setFormData({ ...formData, modifications: e.target.value })}
                  rows={4}
                  placeholder={"Suspension KW V3\nÉchappement custom\nAdmission carbone\n..."}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Une modification par ligne</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Histoire</label>
                <textarea
                  value={formData.story}
                  onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                  rows={3}
                  placeholder="L'histoire de cette voiture..."
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Photos</label>
                <ImageUpload
                  value={formData.photos}
                  onChange={(photos) => {
                    const newPhotos = photos as string[];
                    const validContainPhotos = formData.containPhotos.filter(
                      (index) => index < newPhotos.length
                    );
                    setFormData({
                      ...formData,
                      photos: newPhotos,
                      containPhotos: validContainPhotos,
                    });
                  }}
                  multiple
                  folder="lfp/cars"
                />
              </div>

              {formData.photos.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Mode d&apos;affichage des photos
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Activez &quot;Contenir&quot; pour les photos qui ne doivent pas être recadrées (ex: photos en portrait)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formData.photos.map((photo, index) => {
                      const isContain = formData.containPhotos.includes(index);
                      return (
                        <div
                          key={index}
                          className="relative bg-[#0a0a0a] border border-white/10 rounded-lg overflow-hidden"
                        >
                          <div className="relative h-24">
                            <Image
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              fill
                              className={isContain ? 'object-contain' : 'object-cover'}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newContainPhotos = isContain
                                ? formData.containPhotos.filter((i) => i !== index)
                                : [...formData.containPhotos, index];
                              setFormData({ ...formData, containPhotos: newContainPhotos });
                            }}
                            className={`w-full px-2 py-1.5 text-xs transition-colors cursor-pointer ${
                              isContain
                                ? 'bg-lfp-green text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {isContain ? 'Contenir' : 'Couvrir'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 border border-white/10 text-gray-400 hover:text-white hover:border-white cursor-pointer rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-white/50 hover:bg-white text-black cursor-pointer rounded-lg transition-colors"
                >
                  {editingCar ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GaragePatternLegend />

      <div className={`flex items-center gap-2 mb-4 transition-opacity duration-300 ${isSavingOrder ? 'opacity-100' : 'opacity-0'}`}>
        <svg className="w-3.5 h-3.5 animate-spin text-gray-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-gray-500">Sauvegarde en cours...</span>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Chargement...</div>
        ) : cars.length === 0 ? (
          <div className="text-center text-gray-400 py-12">Aucune voiture</div>
        ) : (
          cars.map((car, index) => {
            const position = getPatternPosition(index);
            const isDraggingOver = dragOverIndex === index;

            return (
              <div
                key={car.id}
                draggable={canEdit}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 bg-[#141414] border rounded-xl p-3 transition-all ${
                  car.isActive ? 'border-white/10' : 'border-red-500/30 opacity-60'
                } ${isDraggingOver ? 'border-white/40 bg-white/5 scale-[1.01]' : ''} ${
                  canEdit ? 'cursor-grab active:cursor-grabbing' : ''
                }`}
              >
                {canEdit && (
                  <div className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors pl-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                )}

                <div className="shrink-0 flex flex-col items-center gap-1 w-16">
                  <span className="text-2xl font-black text-white/20">#{index + 1}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium leading-tight text-center ${position.colorClass}`}>
                    {position.short}
                  </span>
                </div>

                <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-black shrink-0">
                  {car.photos[0] ? (
                    <Image
                      src={car.photos[0]}
                      alt={car.model}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                      No photo
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{car.model}</h3>
                  <p className="text-lfp-green text-sm">{car.year}</p>
                  <p className="text-gray-500 text-xs truncate">{car.member?.name || 'N/A'} · {car.photos.length} photo{car.photos.length > 1 ? 's' : ''}</p>
                </div>

                <div className="hidden md:block shrink-0 max-w-[180px]">
                  <p className={`text-xs ${position.colorClass.split(' ')[1]}`}>{position.label}</p>
                </div>

                {canEdit && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => movecar(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                      title="Monter"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => movecar(index, 'down')}
                      disabled={index === cars.length - 1}
                      className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                      title="Descendre"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="flex gap-2 shrink-0">
                  {canEdit && (
                    <button
                      onClick={() => handleEdit(car)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors cursor-pointer"
                    >
                      Modifier
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(car.id, car.model)}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-colors cursor-pointer"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function VoituresPage() {
  return (
    <AdminLayout>
      <VoituresContent />
    </AdminLayout>
  );
}
