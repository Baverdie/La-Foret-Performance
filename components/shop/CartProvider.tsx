'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLine } from '@/lib/shop/cart';

// Cle de persistance du panier dans le localStorage.
const STORAGE_KEY = 'lfp-cart';

// API exposee par le contexte panier.
interface CartContextValue {
  items: CartLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addLine: (line: CartLine) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeLine: (productId: string, variantId: string | null) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// Identifie une ligne de panier de maniere unique (produit + variante).
function sameLine(line: CartLine, productId: string, variantId: string | null): boolean {
  return line.productId === productId && line.variantId === variantId;
}

// Fournit l'etat du panier (persiste en localStorage) a tout l'arbre de la boutique.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Chargement initial depuis le localStorage (cote client uniquement).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Panier corrompu : on repart d'un panier vide.
    }
    setHydrated(true);
  }, []);

  // Persistance a chaque modification (apres hydratation pour ne pas ecraser le stockage).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Stockage indisponible : on ignore silencieusement.
    }
  }, [items, hydrated]);

  // Ajoute une ligne au panier (fusionne les quantites si la ligne existe deja).
  const addLine = useCallback((line: CartLine) => {
    setItems((prev) => {
      const existing = prev.find((item) => sameLine(item, line.productId, line.variantId));
      if (existing) {
        return prev.map((item) =>
          sameLine(item, line.productId, line.variantId)
            ? { ...item, quantity: item.quantity + line.quantity }
            : item
        );
      }
      return [...prev, line];
    });
  }, []);

  // Definit la quantite d'une ligne (la supprime si <= 0).
  const setQuantity = useCallback((productId: string, variantId: string | null, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((item) => !sameLine(item, productId, variantId))
        : prev.map((item) =>
            sameLine(item, productId, variantId) ? { ...item, quantity } : item
          )
    );
  }, []);

  // Retire une ligne du panier.
  const removeLine = useCallback((productId: string, variantId: string | null) => {
    setItems((prev) => prev.filter((item) => !sameLine(item, productId, variantId)));
  }, []);

  // Vide entierement le panier.
  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    hydrated,
    addLine,
    setQuantity,
    removeLine,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook d'acces au contexte panier. Lance une erreur si utilise hors du CartProvider.
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart doit être utilisé dans un CartProvider');
  }
  return context;
}
