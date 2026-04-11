'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import Image from 'next/image';

interface DatePickerProps {
  value: string; // format YYYY-MM-DD
  onChange: (date: string) => void;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function DatePicker({ value, onChange }: DatePickerProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return { day: '', month: '', year: '' };
    const [year, month, day] = dateStr.split('-');
    return { day: day || '', month: month || '', year: year || '' };
  };

  const initialParsed = parseDate(value);
  const [localDay, setLocalDay] = useState(initialParsed.day);
  const [localMonth, setLocalMonth] = useState(initialParsed.month);
  const [localYear, setLocalYear] = useState(initialParsed.year);

  useEffect(() => {
    const parsed = parseDate(value);
    setLocalDay(parsed.day);
    setLocalMonth(parsed.month);
    setLocalYear(parsed.year);
  }, [value]);

  const getDaysInMonth = (m: string, y: string) => {
    if (!m || !y) return 31;
    return new Date(parseInt(y), parseInt(m), 0).getDate();
  };

  const daysInMonth = getDaysInMonth(localMonth, localYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleChange = (field: 'day' | 'month' | 'year', val: string) => {
    let newDay = localDay;
    let newMonth = localMonth;
    let newYear = localYear;

    if (field === 'day') { newDay = val; setLocalDay(val); }
    if (field === 'month') { newMonth = val; setLocalMonth(val); }
    if (field === 'year') { newYear = val; setLocalYear(val); }

    if (newDay && newMonth && newYear) {
      const maxDays = getDaysInMonth(newMonth, newYear);
      if (parseInt(newDay) > maxDays) {
        newDay = maxDays.toString().padStart(2, '0');
        setLocalDay(newDay);
      }
      onChange(`${newYear}-${newMonth}-${newDay}`);
    }
  };

  const selectClass = "px-3 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green cursor-pointer";

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="relative">
        <select
          value={localDay}
          onChange={(e) => handleChange('day', e.target.value)}
          className={selectClass}
          required
        >
          <option value="">Jour</option>
          {days.map((d) => (
            <option key={d} value={d.toString().padStart(2, '0')}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <select
          value={localMonth}
          onChange={(e) => handleChange('month', e.target.value)}
          className={selectClass}
          required
        >
          <option value="">Mois</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={(i + 1).toString().padStart(2, '0')}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <select
          value={localYear}
          onChange={(e) => handleChange('year', e.target.value)}
          className={selectClass}
          required
        >
          <option value="">Année</option>
          {years.map((y) => (
            <option key={y} value={y.toString()}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  photo: string | null;
  status: 'past' | 'upcoming';
  order: number;
  isActive: boolean;
}

function EventsContent() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    photo: '',
  });

  const userPermissions = session?.user?.permissions || [];
  const canCreate = hasPermission(userPermissions, PERMISSIONS.EVENTS_CREATE);
  const canEdit = hasPermission(userPermissions, PERMISSIONS.EVENTS_EDIT);
  const canDelete = hasPermission(userPermissions, PERMISSIONS.EVENTS_DELETE);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingEvent ? `/api/admin/events/${editingEvent.id}` : '/api/admin/events';
    const method = editingEvent ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photo: formData.photo || null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingEvent(null);
        resetForm();
        fetchEvents();
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      location: '',
      description: '',
      photo: '',
    });
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: new Date(event.date).toISOString().split('T')[0],
      location: event.location,
      description: event.description,
      photo: event.photo || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet événement ?')) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-7xl font-black text-white mb-2">Événements</h1>
          <p className="text-gray-400">Gérer les sorties du crew</p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setEditingEvent(null);
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-white/50 hover:bg-white text-black cursor-pointer font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvel événement
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'upcoming', 'past'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${filter === f
                ? 'bg-white text-black'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
          >
            {f === 'all' ? 'Tous' : f === 'upcoming' ? 'À venir' : 'Passés'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-xl p-8 w-full max-w-lg my-8">
            <h2 className="text-2xl font-display text-white mb-6">
              {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Titre</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Balade Côte Sauvage"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Date</label>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                />
                <p className="text-xs text-gray-500 mt-1">Le statut (passé/à venir) est calculé automatiquement selon la date</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Lieu</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  placeholder="La Palmyre"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Description de l'événement..."
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-lfp-green resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Photo (optionnel)</label>
                <ImageUpload
                  value={formData.photo}
                  onChange={(photo) => setFormData({ ...formData, photo: photo as string })}
                  folder="lfp/events"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 border border-white/10 text-gray-400 hover:border-white hover:text-white cursor-pointer rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-white/50 hover:bg-white text-black cursor-pointer font-medium rounded-lg transition-colors"
                >
                  {editingEvent ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Chargement...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center text-gray-400 py-12">Aucun événement</div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-[#141414] border border-white/10 rounded-xl p-6 flex gap-6"
            >
              {event.photo && (
                <div className="relative w-32 h-24 shrink-0 rounded-lg overflow-hidden bg-black">
                  <Image
                    src={event.photo}
                    alt={event.title}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-display text-white">{event.title}</h3>
                    <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${event.status === 'upcoming'
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-500/20 text-gray-400'
                      }`}
                  >
                    {event.status === 'upcoming' ? 'À venir' : 'Passé'}
                  </span>
                </div>

                <p className="text-white text-sm mb-2">{formatDate(event.date)}</p>
                {event.description && (
                  <p className="text-gray-400 text-sm line-clamp-2">{event.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {canEdit && (
                  <button
                    onClick={() => handleEdit(event)}
                    className="px-4 py-2 bg-white/50 hover:bg-white text-black cursor-pointer font-medium rounded-lg transition-colors"
                  >
                    Modifier
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm cursor-pointer rounded-lg transition-colors"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <AdminLayout>
      <EventsContent />
    </AdminLayout>
  );
}
