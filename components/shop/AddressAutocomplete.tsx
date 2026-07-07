'use client';

import { useEffect, useRef, useState } from 'react';

// Adresse normalisée renvoyée à la sélection.
export interface SelectedAddress {
  addressLine1: string;
  postalCode: string;
  city: string;
}

// Propriété d'une "feature" renvoyée par l'API Base Adresse Nationale.
interface BanFeature {
  properties: {
    label: string;
    name: string;
    postcode: string;
    city: string;
    context: string;
    id: string;
  };
}

interface AddressAutocompleteProps {
  label: string;
  value: string;
  required: boolean;
  onChangeText: (value: string) => void;
  onSelect: (address: SelectedAddress) => void;
}

// Champ d'adresse avec autocomplétion via l'API Base Adresse Nationale (gratuite, sans clé).
// Au choix d'une suggestion, remplit la rue, le code postal et la ville.
export default function AddressAutocomplete({
  label,
  value,
  required,
  onChangeText,
  onSelect,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<BanFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Empeche une nouvelle requete juste apres une selection (la valeur vient d'etre remplie).
  const skipNextFetch = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Recherche d'adresses (debouncée) à chaque frappe.
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data.features || []);
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        // Requete annulee ou reseau indisponible : on ignore.
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  // Ferme la liste au clic en dehors du composant.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Applique la suggestion choisie aux champs adresse / CP / ville.
  const handleSelect = (feature: BanFeature) => {
    skipNextFetch.current = true;
    onSelect({
      addressLine1: feature.properties.name,
      postalCode: feature.properties.postcode,
      city: feature.properties.city,
    });
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  // Navigation clavier dans la liste de suggestions.
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="sm:col-span-2 relative" ref={containerRef}>
      <label className="block text-gray-400 text-xs mb-1.5">
        {label} {required && <span className="text-lfp-amber">*</span>}
      </label>
      <input
        type="text"
        value={value}
        required={required}
        autoComplete="off"
        onChange={(event) => onChangeText(event.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Commencez à taper votre adresse…"
        className="w-full bg-[#0a0a0a] border border-white/10 rounded-none px-4 py-3 text-white text-sm focus:border-lfp-amber focus:outline-none transition-colors"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-[#141414] border border-white/15 rounded-none overflow-hidden shadow-xl">
          {suggestions.map((feature, index) => (
            <li key={feature.properties.id}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(feature)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                  index === activeIndex ? 'bg-lfp-amber/20 text-white' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span className="text-white">{feature.properties.name}</span>
                <span className="text-gray-500"> · {feature.properties.postcode} {feature.properties.city}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
